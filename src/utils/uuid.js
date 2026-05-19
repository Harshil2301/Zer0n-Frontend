// UUID Generation Utility
import { v4 as uuidv4 } from 'uuid'

/**
 * Generate a new UUID for user identification
 * @returns {string} UUID v4 string
 */
export const generateUserId = () => {
  return uuidv4()
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid UUID
 */
export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Extract UUID from URL query parameters
 * @returns {string|null} UUID or null if not found
 */
export const getUUIDFromURL = () => {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')
  return id && isValidUUID(id) ? id : null
}

/**
 * Redirect to page with UUID
 * @param {string} path - Path to redirect to
 * @param {string} uuid - User UUID
 */
export const redirectWithUUID = (path, uuid) => {
  window.location.href = `${path}?id=${uuid}`
}
