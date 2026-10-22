// This file contains all API calls to the API endpoints.
// Error handling lives in ONE place: the response interceptor below.
import axios from 'axios'

// Create HTTP client with the base URL from .env (VITE_ROOT_API)
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_ROOT_API,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ---------- Auth header helpers ----------
export function setAuthHeader(token) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export function removeAuthHeader() {
  delete apiClient.defaults.headers.common['Authorization']
}

// ---------- Centralized error handling (F2) ----------
// The store registers a function here (see main.js) that clears the session
// and sends the user to /login. Registering it avoids a circular import
// between api.js and the Pinia store.
let onUnauthorized = null
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

// Turn whatever the server sent back into one short, readable string
function messageFromResponse(data) {
  if (!data) return null
  if (typeof data === 'string') {
    // some endpoints send JSON as a string, e.g. '{"errors":[{"msg":"..."}]}'
    try {
      return messageFromResponse(JSON.parse(data))
    } catch {
      return data
    }
  }
  if (data.error) return data.error
  if (Array.isArray(data.errors) && data.errors[0]?.msg) return data.errors[0].msg
  if (data.message) return messageFromResponse(data.message)
  return null
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // No response at all = backend down / network problem
    if (!error.response) {
      return Promise.reject(new Error('Unable to reach the server'))
    }

    const { status, data, config } = error.response
    const isLoginRequest = config?.url?.includes('/users/login')

    // 401 on anything except the login form itself = session is no longer valid
    if (status === 401 && !isLoginRequest && onUnauthorized) {
      onUnauthorized()
    }

    const message =
      messageFromResponse(data) ||
      (status === 401
        ? 'Your session has expired. Please log in again.'
        : status === 403
          ? 'You do not have permission to do that.'
          : status === 404
            ? 'Not found.'
            : 'Something went wrong. Please try again.')

    const err = new Error(message)
    err.status = status
    return Promise.reject(err)
  }
)

// ---------- Login ----------
export async function loginUser(username, password) {
  const response = await apiClient.post('/users/login', { username, password })
  const token = response.data.token
  localStorage.setItem('authToken', token)
  setAuthHeader(token)
  return token
}

export function logoutUser() {
  localStorage.removeItem('authToken')
  removeAuthHeader()
}

// ---------- Org ----------
export const getOrgName = async () => (await apiClient.get('/org')).data

// ---------- Events ----------
export const getEvents = async () => (await apiClient.get('/events/')).data

export const getEventById = async (id) =>
  (await apiClient.get(`/events/id/${id}`)).data

export const searchEvents = async (query) => {
  const params = {}
  if (query.searchBy === 'name') {
    params.searchBy = 'name'
    params.name = query.name || ''
  } else if (query.searchBy === 'date') {
    params.searchBy = 'date'
    params.eventDate = query.eventDate || ''
  }
  return (await apiClient.get('/events/search', { params })).data
}

export const getClientEvents = async (id) =>
  (await apiClient.get(`/events/client/${id}`)).data

export const getNonClientEvents = async (id) =>
  (await apiClient.get(`/events/client/${id}/not-registered`)).data

export const getEventAttendees = async (id) =>
  (await apiClient.get(`/events/attendees/${id}`)).data

export const getEventsByServiceId = async (id) =>
  (await apiClient.get(`/events/service/${id}`)).data

export const createEvent = async (eventData) =>
  (await apiClient.post('/events/', eventData)).data

export const updateEvent = async (id, eventData) =>
  (await apiClient.put(`/events/update/${id}`, eventData)).data

// B1: backend responds { message: 'Already registered' } on a duplicate
export const registerAttendee = async (eventId, clientId) =>
  (
    await apiClient.put('/events/register', {}, {
      params: { event: eventId, client: clientId }
    })
  ).data

// B1: backend responds { message: 'Not registered' } if client wasn't registered
export const deregisterAttendee = async (eventId, clientId) =>
  (
    await apiClient.put('/events/deregister', {}, {
      params: { event: eventId, client: clientId }
    })
  ).data

export const deleteEvent = async (id) =>
  (await apiClient.delete(`/events/${id}`)).data

export const getAttendance = async () =>
  (await apiClient.get('/events/attendance')).data

// ---------- Clients ----------
export const getClients = async () => (await apiClient.get('/clients')).data

export const getClientById = async (id) =>
  (await apiClient.get(`/clients/id/${id}`)).data

export const searchClients = async (query) => {
  const params = {}
  if (query.searchBy === 'name') {
    params.searchBy = 'name'
    params.firstName = query.firstName || ''
    params.lastName = query.lastName || ''
  } else if (query.searchBy === 'number') {
    params.searchBy = 'number'
    params.phoneNumber = query.phoneNumber || ''
  }
  return (await apiClient.get('/clients/search', { params })).data
}

export const createClient = async (newClient) =>
  (await apiClient.post('/clients', newClient)).data

export const updateClient = async (id, updatedClient) =>
  (await apiClient.put(`/clients/update/${id}`, updatedClient)).data

export const deleteClientbyId = async (id) =>
  (await apiClient.delete(`/clients/${id}`)).data

export const getClientsByZipCode = async () =>
  (await apiClient.get('/clients/byzip')).data

// ---------- Services ----------
export const getServices = async () => (await apiClient.get('/services/')).data

export const getServiceById = async (id) =>
  (await apiClient.get(`/services/id/${id}`)).data

export const searchServices = async (query) => {
  const params = { searchBy: query.searchBy }
  if (query.searchBy === 'name') {
    params.name = query.name || ''
  } else if (query.searchBy === 'description') {
    params.description = query.description || ''
  }
  return (await apiClient.get('/services/search', { params })).data
}

export const createService = async (newService) =>
  (await apiClient.post('/services', newService)).data

export const updateService = async (id, updatedService) =>
  (await apiClient.put(`/services/update/${id}`, updatedService)).data

export const deleteService = async (id) =>
  (await apiClient.delete(`/services/${id}`)).data