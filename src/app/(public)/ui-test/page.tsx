// Create this file at: src/app/(public)/ui-test/page.tsx
'use client'

import { useState } from 'react'
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardContent,
  Modal,
  Badge,
  LoadingSpinner,
  ProgressBar,
  Tooltip,
  DeleteConfirmation
} from '@/components/shared/ui'
import { useTheme } from '@/providers/theme-provider'

export default function UITestPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [progress, setProgress] = useState(65)
  const { theme } = useTheme()

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold text-foreground">UI Components Test Page</h1>
      <p className="text-secondary">Current theme: <Badge variant="primary">{theme}</Badge></p>

      {/* Buttons Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Buttons</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button isLoading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Inputs</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            placeholder="Normal input" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Input 
            placeholder="With error" 
            error="This field is required"
          />
          <Input 
            placeholder="Disabled input" 
            disabled
          />
        </CardContent>
      </Card>

      {/* Badges Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Badges</h2>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge size="sm">Small</Badge>
        </CardContent>
      </Card>

      {/* Progress Bar Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Progress Bars</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar value={progress} showLabel />
          <ProgressBar value={25} variant="success" />
          <ProgressBar value={50} variant="warning" />
          <ProgressBar value={75} variant="error" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>
              -10%
            </Button>
            <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>
              +10%
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading Spinners */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Loading Spinners</h2>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <LoadingSpinner size="sm" />
          <LoadingSpinner size="md" />
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>

      {/* Tooltips */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Tooltips</h2>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Tooltip content="Top tooltip" position="top">
            <Button variant="outline">Hover me (top)</Button>
          </Tooltip>
          <Tooltip content="Bottom tooltip" position="bottom">
            <Button variant="outline">Hover me (bottom)</Button>
          </Tooltip>
          <Tooltip content="Left tooltip" position="left">
            <Button variant="outline">Hover me (left)</Button>
          </Tooltip>
          <Tooltip content="Right tooltip" position="right">
            <Button variant="outline">Hover me (right)</Button>
          </Tooltip>
        </CardContent>
      </Card>

      {/* Modals */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Modals</h2>
        </CardHeader>
        <CardContent className="space-x-2">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Test Delete Confirmation
          </Button>
        </CardContent>
      </Card>

      {/* Modal Component */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Example Modal"
        size="md"
      >
        <p className="text-secondary mb-4">
          This is an example modal. Press ESC or click the backdrop to close.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setModalOpen(false)}>
            Confirm
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      {deleteOpen && (
        <DeleteConfirmation
          title="Delete Novel"
          message="Are you sure you want to delete this novel? This action cannot be undone."
          dependencies={["42 chapters", "156 comments", "89 reviews"]}
          confirmText="DELETE NOVEL"
          onConfirm={async () => {
            setLoading(true)
            await new Promise(resolve => setTimeout(resolve, 2000))
            setLoading(false)
            setDeleteOpen(false)
          }}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  )
}