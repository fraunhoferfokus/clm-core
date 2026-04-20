"use strict";
/* -----------------------------------------------------------------------------
 *  Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, version 3.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program. If not, see <https://www.gnu.org/licenses/>.  
 *
 *  No Patent Rights, Trademark Rights and/or other Intellectual Property
 *  Rights other than the rights under this license are granted.
 *  All other rights reserved.
 *
 *  For any other rights, a separate agreement needs to be closed.
 *
 *  For more information please contact:  
 *  Fraunhofer FOKUS
 *  Kaiserin-Augusta-Allee 31
 *  10589 Berlin, Germany
 *  https://www.fokus.fraunhofer.de/go/fame
 *  famecontact@fokus.fraunhofer.de
 * -----------------------------------------------------------------------------
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncGroupsAndMembershipsFromClaims = void 0;
const config_1 = require("../config/config");
const GroupDAO_1 = __importDefault(require("../models/Group/GroupDAO"));
const GroupModel_1 = __importDefault(require("../models/Group/GroupModel"));
const RelationBDTO_1 = __importDefault(require("../models/Relation/RelationBDTO"));
const RoleDAO_1 = __importDefault(require("../models/Role/RoleDAO"));
function readGroupPattern() {
    var _a;
    const pattern = (_a = process.env.OIDC_ALLOWED_GROUP_PATTERN) === null || _a === void 0 ? void 0 : _a.trim();
    if (!pattern)
        return undefined;
    try {
        return new RegExp(pattern);
    }
    catch (err) {
        console.warn('[OIDC] Invalid OIDC_ALLOWED_GROUP_PATTERN; ignoring:', err);
        return undefined;
    }
}
const allowedGroupPattern = readGroupPattern();
function normalizeGroupToken(raw) {
    return (raw || '').replace(/\s*_\s*/g, config_1.CONFIG.OIDC_GROUP_ROLE_DELIMITER).replace(/\s+/g, ' ').trim();
}
function parseGroupEntry(entry) {
    const cleaned = normalizeGroupToken(entry);
    if (!cleaned)
        return { base: '', suffix: null };
    const delim = config_1.CONFIG.OIDC_GROUP_ROLE_DELIMITER;
    const lastIdx = cleaned.lastIndexOf(delim);
    if (lastIdx < 0)
        return { base: cleaned, suffix: null };
    const base = cleaned.substring(0, lastIdx);
    const rawSuffix = cleaned.substring(lastIdx + delim.length);
    return { base: base || cleaned, suffix: rawSuffix || null };
}
function suffixToInternalRole(suffix) {
    const s = (suffix || '').trim().toLowerCase();
    const sufLearner = config_1.CONFIG.OIDC_GROUP_SUFFIX_LEARNER.toLowerCase();
    const sufInstructor = config_1.CONFIG.OIDC_GROUP_SUFFIX_INSTRUCTOR.toLowerCase();
    const sufAdmin = config_1.CONFIG.OIDC_GROUP_SUFFIX_ADMIN.toLowerCase();
    if (s === sufInstructor)
        return config_1.CONFIG.OIDC_ROLEMAP_INSTRUCTOR;
    if (s === sufAdmin)
        return config_1.CONFIG.OIDC_ROLEMAP_ADMIN;
    if (s === sufLearner || !s)
        return config_1.CONFIG.OIDC_ROLEMAP_LEARNER;
    return config_1.CONFIG.OIDC_ROLEMAP_LEARNER;
}
function findGroupWithRole(displayName, roleName) {
    return __awaiter(this, void 0, void 0, function* () {
        const role = yield RoleDAO_1.default.findByRoleName(roleName);
        const [groups, relations] = yield Promise.all([
            GroupDAO_1.default.findByAttributes({ displayName }),
            RelationBDTO_1.default.findAll()
        ]);
        for (const group of groups) {
            const rel = relations.find((relation) => relation.fromType === 'group' && relation.fromId === group._id && relation.toType === 'role');
            if (rel && rel.toId === role._id)
                return group;
        }
        return undefined;
    });
}
function ensureGroupWithRole(displayName, roleName) {
    return __awaiter(this, void 0, void 0, function* () {
        const existing = yield findGroupWithRole(displayName, roleName);
        if (existing)
            return existing;
        if (!config_1.CONFIG.OIDC_AUTO_CREATE_GROUPS)
            return undefined;
        const role = yield RoleDAO_1.default.findByRoleName(roleName);
        return GroupDAO_1.default.insert(new GroupModel_1.default({ displayName }), { role: role._id });
    });
}
function ensureHierarchy(groupsByRole) {
    return __awaiter(this, void 0, void 0, function* () {
        const admin = groupsByRole['OrgAdmin'];
        const instructor = groupsByRole['Instructor'];
        const learner = groupsByRole['Learner'];
        if (admin && instructor) {
            try {
                yield RelationBDTO_1.default.addGroupToGroup(admin._id, instructor._id);
            }
            catch (_) { /* ignore */ }
        }
        else if (admin && learner) {
            try {
                yield RelationBDTO_1.default.addGroupToGroup(admin._id, learner._id);
            }
            catch (_) { /* ignore */ }
        }
        if (instructor && learner) {
            try {
                yield RelationBDTO_1.default.addGroupToGroup(instructor._id, learner._id);
            }
            catch (_) { /* ignore */ }
        }
    });
}
function isAllowedGroupName(raw) {
    if (raw.length > 128)
        return false;
    if (!allowedGroupPattern)
        return true;
    return allowedGroupPattern.test(raw);
}
function syncGroupsAndMembershipsFromClaims(userId, groupsRaw) {
    return __awaiter(this, void 0, void 0, function* () {
        const items = (groupsRaw || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, config_1.CONFIG.OIDC_GROUP_SYNC_MAX_ITEMS);
        const baseToRoleName = new Map();
        for (const raw of items) {
            if (!isAllowedGroupName(raw))
                continue;
            const { base, suffix } = parseGroupEntry(raw);
            if (!base)
                continue;
            const internalRole = suffixToInternalRole(suffix);
            if (internalRole === 'OrgAdmin' && !config_1.CONFIG.OIDC_ALLOW_ADMIN_GROUP_SYNC)
                continue;
            if (!baseToRoleName.has(base))
                baseToRoleName.set(base, new Map());
            baseToRoleName.get(base).set(internalRole, raw);
        }
        const desiredGroupIds = [];
        for (const [, roleNameMap] of baseToRoleName.entries()) {
            const groupsByRole = {};
            for (const roleName of Array.from(roleNameMap.keys())) {
                const displayName = roleNameMap.get(roleName);
                if (!displayName)
                    continue;
                const group = yield ensureGroupWithRole(displayName, roleName);
                if (!group)
                    continue;
                groupsByRole[roleName] = group;
                desiredGroupIds.push(group._id);
            }
            yield ensureHierarchy(groupsByRole);
        }
        const current = yield RelationBDTO_1.default.getUsersGroups(userId);
        const currentIds = new Set(current.map((group) => group._id));
        const desiredIds = new Set(desiredGroupIds);
        for (const groupId of desiredIds) {
            if (!currentIds.has(groupId)) {
                try {
                    yield RelationBDTO_1.default.addUserToGroup(userId, groupId);
                }
                catch (_) { /* ignore */ }
            }
        }
        for (const groupId of currentIds) {
            if (!desiredIds.has(groupId)) {
                try {
                    yield RelationBDTO_1.default.removeUserFromGroup(userId, groupId);
                }
                catch (_) { /* ignore */ }
            }
        }
    });
}
exports.syncGroupsAndMembershipsFromClaims = syncGroupsAndMembershipsFromClaims;
