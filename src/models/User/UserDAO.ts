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
import GroupModel from "../Group/GroupModel";
import RelationModel from "../Relation/RelationModel";
import { UserModel } from "./UserModel";
import GroupDAO from "../Group/GroupDAO";
import RelationDAO from "../Relation/RelationDAO";

const TABLENAME = 'user'

class UserDAO extends BaseDAO<UserModel>{


    insert(payload: UserModel): Promise<UserModel> {
        return super.insert(payload).then((user) => {

            let personal_group_id = '_group_' + user._id

            return Promise.all([
                GroupDAO.insert(new GroupModel({ _id: personal_group_id, displayName: "" })),
                // RelationDAO.insert(new RelationModel({ fromId: user._id, toId: user._id, fromType: 'user', toType: 'group' })),
                user,
                RelationDAO.insert(new RelationModel({ fromId: personal_group_id, toId: user._id, fromType: 'group', toType: 'user' })),

            ])
        }).then(([, user]) => user)
    }

    deleteById(id: string): Promise<boolean> {
        return super.deleteById(id).then(async () => {
            const userRelations = (await RelationDAO.findAll())
                .filter((relation) => relation.fromId === id || relation.toId === id)
            Promise.all([
                RelationDAO.bulkDelete(userRelations.map((relation) => ({ ...relation, _deleted: true } as unknown as RelationModel))),
                GroupDAO.deleteById('_group_' + id)
            ])
        }
        ).then(() => true)
    }

}



export default new UserDAO(TABLENAME, UserModel)

