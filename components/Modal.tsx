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
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[90vh] overflow-y-auto sm:max-w-md sm:mx-auto sm:rounded-2xl px-0 pb-0"
      >
        <SheetHeader className="px-5 pb-4 border-b">
          <SheetTitle className="text-left text-base font-semibold">{title}</SheetTitle>
        </SheetHeader>
        <div className="px-5 py-5 overflow-y-auto">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
