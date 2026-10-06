'use server'

import {
  updateCustomerProfile,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  cancelCustomerOrder,
} from '@/lib/services/customerStore'

export async function updateCustomerProfileAction(input: Parameters<typeof updateCustomerProfile>[0]) {
  return updateCustomerProfile(input)
}

export async function addCustomerAddressAction(input: Parameters<typeof addCustomerAddress>[0]) {
  return addCustomerAddress(input)
}

export async function updateCustomerAddressAction(id: string, input: Parameters<typeof updateCustomerAddress>[1]) {
  return updateCustomerAddress(id, input)
}

export async function deleteCustomerAddressAction(id: string) {
  return deleteCustomerAddress(id)
}

export async function setDefaultCustomerAddressAction(id: string) {
  return setDefaultCustomerAddress(id)
}

export async function cancelCustomerOrderAction(orderId: string, reason?: string) {
  return cancelCustomerOrder(orderId, reason)
}
