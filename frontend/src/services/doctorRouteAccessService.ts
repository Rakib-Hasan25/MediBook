import { fetchDoctorPendingProfile } from './doctorPendingService'

export type DoctorRouteAccessStatus = 'verified' | 'pending' | 'not-doctor'

export async function getDoctorRouteAccessStatus(): Promise<DoctorRouteAccessStatus> {
  const response = await fetchDoctorPendingProfile()

  if (!response.exists || !response.doctor) {
    return 'not-doctor'
  }

  if (response.doctor['doctor-status'] === 'verified') {
    return 'verified'
  }

  return 'pending'
}
