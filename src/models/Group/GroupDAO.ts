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

import BaseDAO from "../BaseDAO";
import GroupModel from './GroupModel'
import RelationBDTO from "../Relation/RelationBDTO";
import RelationModel from "../Relation/RelationModel";
import RoleDAO from "../Role/RoleDAO";
const TABLENAME = 'groups'


class GroupDAO extends BaseDAO<GroupModel>{

    async insert(model: GroupModel, payload?: { [key: string]: any }): Promise<GroupModel> {
        const targetedRoleId = payload?.role
        const role =
            targetedRoleId ? await RoleDAO.findById(targetedRoleId) :
                await RoleDAO.findByRoleName('Self')
        return super.insert(model).then((group) =>
            Promise.all([
                RelationBDTO.createRelationship(
                    new RelationModel({ fromId: group._id, fromType: 'group', toType: 'role', toId: role._id })),
                group
            ])).then(([, group]) => group)
    }

    deleteById(id: string): Promise<boolean> {
        return super.deleteById(id).then(async () => {
            const groupHasRelations = (await RelationBDTO.findAll()).filter((item) => item.toId === id || item.fromId === id)
            return RelationBDTO.bulkDelete(groupHasRelations.map((item) => ({ ...item, _deleted: true }) as any))
        })
    }

}


export default new GroupDAO(TABLENAME, GroupModel)

