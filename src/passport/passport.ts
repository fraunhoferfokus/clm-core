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

 import passport from 'passport'
import localStrategy from 'passport-local'
import httpStrategy from 'passport-http'

// import CouchUserDAO from '../models/User/CouchUserDAO'
import PasswordService from '../services/PasswordService'
import UserDAO from '../models/User/UserDAO'

const BasicStrategy = httpStrategy.BasicStrategy
const LocalStrategy = localStrategy.Strategy

const checkUserAndPassword = async (username: string, password: string, done: any) => {
    try {
        const user = await UserDAO.findById(username)
        if (!await PasswordService.verifyPassword(password, user.password)) return done(null, false)
        if (!user.isVerified) return done({ message: "User is not verified yet! Check your email", status: 400 })
        return done(null, user)
    } catch (err: any) {
        if (err.status === 404) return done({ message: "Wrong username or password!", status: 400 })

        return done(err)
    }
}


passport.use(new LocalStrategy({ usernameField: 'email' }, checkUserAndPassword))
// passport.use(new BasicStrategy(checkUserAndPassword))





export default passport

