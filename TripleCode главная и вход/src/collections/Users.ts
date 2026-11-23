import type { Access, CollectionConfig } from 'payload'

const isAppUser: Access = ({ req }) => req.user?.collection === 'users'

const isSelf: Access = ({ req }) => {
  if (req.user?.collection !== 'users') return false
  return { id: { equals: req.user.id } }
}

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: () => false,
    create: () => false,
    delete: () => false,
    read: isSelf,
    update: isSelf,
    unlock: isAppUser,
  },
  admin: {
    hidden: true,
    useAsTitle: 'email',
  },
  auth: {
    maxLoginAttempts: 8,
    tokenExpiration: 60 * 60 * 24 * 14,
  },
  fields: [],
  versions: false,
}
