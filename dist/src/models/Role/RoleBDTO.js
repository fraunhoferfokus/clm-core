"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleBDTOInstance = void 0;
const BaseBackendDTO_1 = __importDefault(require("../BaseBackendDTO"));
const RoleDAO_1 = __importDefault(require("./RoleDAO"));
class RoleBDTO extends BaseBackendDTO_1.default {
}
exports.roleBDTOInstance = new RoleBDTO(RoleDAO_1.default);
