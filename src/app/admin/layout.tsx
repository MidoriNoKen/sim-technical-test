import { ReactNode } from "react"
import { Toaster } from "sonner"
import { AdminLayout as BaseAdminLayout } from "@/components/admin/AdminLayout"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <BaseAdminLayout>{children}</BaseAdminLayout>
      <Toaster position="top-right" />
    </>
  )
}