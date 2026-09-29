// api/index.js
import * as categoryApi from './categories'
import * as materialApi from './materials'
import * as attachmentApi from './attachments.js'
import * as userApi from './users.js'
import * as rolePermissionsApi from './role-permissions'
import * as authApi from './auth.js'
import * as keyComponentcategoryApi from './key-component-catalogs.js'
import * as keyComponentApi from './key-components.js'

export default {
  categories: categoryApi,
  materials: materialApi,
  attachments: attachmentApi,
  users: userApi,
  rolePermissions: rolePermissionsApi,
  auth: authApi,
  keyComponentcategorys: keyComponentcategoryApi,
  keyComponents: keyComponentApi,
}