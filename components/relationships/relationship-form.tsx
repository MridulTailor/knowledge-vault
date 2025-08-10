"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMutation, useQuery } from "@/lib/graphql/client"

const CREATE_RELATIONSHIP_MUTATION = `
  mutation CreateRelationship($input: CreateRelationshipInput!) {
    createRelationship(input: $input) {
      id
      type
      description
      fromEntry {
        id
        title
      }
      toEntry {
        id
        title
      }
    }
  }
`

const ENTRIES_QUERY = `
  query Entries {
    entries {
      id
      title
      type
    }
  }
`

const relationshipTypes = [
  { value: "RELATED_TO", label: "Related to" },
  { value: "SOURCE_FOR", label: "Source for" },
  { value: "INSPIRED_BY", label: "Inspired by" },
  { value: "REFERENCES", label: "References" },
  { value: "CONTRADICTS", label: "Contradicts" },
  { value: "BUILDS_ON", label: "Builds on" },
]

interface RelationshipFormProps {
  fromEntryId: string
  onSuccess: () => void
  onCancel: () => void
}

export function RelationshipForm({ fromEntryId, onSuccess, onCancel }: RelationshipFormProps) {
  const [toEntryId, setToEntryId] = useState("")
  const [type, setType] = useState("RELATED_TO")
  const [description, setDescription] = useState("")

  const { data: entriesData } = useQuery<{ entries: any[] }>(ENTRIES_QUERY)
  const createMutation = useMutation<{ createRelationship: any }>(CREATE_RELATIONSHIP_MUTATION)

  const availableEntries = entriesData?.entries.filter((entry) => entry.id !== fromEntryId) || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!toEntryId) return

    try {
      await createMutation.execute({
        input: {
          fromEntryId,
          toEntryId,
          type,
          description: description || undefined,
        },
      })
      onSuccess()
    } catch (error) {
      console.error("Failed to create relationship:", error)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Relationship</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="toEntry">Link to Entry</Label>
            <Select value={toEntryId} onValueChange={setToEntryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an entry" />
              </SelectTrigger>
              <SelectContent>
                {availableEntries.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Relationship Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((relType) => (
                  <SelectItem key={relType.value} value={relType.value}>
                    {relType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the relationship..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={!toEntryId || createMutation.loading}>
              Create Relationship
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
