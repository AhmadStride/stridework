'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ title, onClose, children }: ModalProps) {
  return (
    <Sheet open onOpenChange={open => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto sm:max-w-md sm:mx-auto sm:rounded-2xl">
        <SheetHeader className="pb-4 border-b mb-4">
          <SheetTitle className="text-left">{title}</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
