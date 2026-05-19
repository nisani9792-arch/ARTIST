const { getAccessByIp } = require('../db.cjs')

const createRequireAccess = (getClientIp) => {
  const requireAccess = async (req, res, next) => {
    try {
      const access = await getAccessByIp(getClientIp(req))

      if (!access.gateUnlocked) {
        res.status(403).json({ error: 'Gate is locked' })
        return
      }

      if (!access.displayName) {
        res.status(403).json({ error: 'Operator registration required' })
        return
      }

      req.access = access
      req.operatorName = access.displayName
      next()
    } catch (error) {
      next(error)
    }
  }

  const requireGateUnlocked = async (req, res, next) => {
    try {
      const access = await getAccessByIp(getClientIp(req))

      if (!access.gateUnlocked) {
        res.status(403).json({ error: 'Gate is locked' })
        return
      }

      req.access = access
      next()
    } catch (error) {
      next(error)
    }
  }

  return { requireAccess, requireGateUnlocked }
}

module.exports = { createRequireAccess }
