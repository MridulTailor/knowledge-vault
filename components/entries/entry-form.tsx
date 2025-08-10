"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useMutation, useQuery } from "@/lib/graphql/client";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

const CREATE_ENTRY_MUTATION = `
  mutation CreateEntry($input: CreateEntryInput!) {
    createEntry(input: $input) {
      id
      title
      content
      type
      language
      url
      createdAt
      tags {
        id
        name
        color
      }
    }
  }
`;

const UPDATE_ENTRY_MUTATION = `
  mutation UpdateEntry($id: ID!, $input: UpdateEntryInput!) {
    updateEntry(id: $id, input: $input) {
      id
      title
      content
      type
      language
      url
      updatedAt
      tags {
        id
        name
        color
      }
    }
  }
`;

const TAGS_QUERY = `
  query Tags {
    tags {
      id
      name
      color
    }
  }
`;

interface EntryFormProps {
  entry?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const entryTypes = [
  { value: "ARTICLE", label: "Article/Note" },
  { value: "CODE_SNIPPET", label: "Code Snippet" },
  { value: "BOOKMARK", label: "Bookmark" },
];

const codeLanguages = [
  "javascript",
  "typescript",
  "python",
  "html",
  "css",
  "json",
  "sql",
  "bash",
  "markdown",
];

export function EntryForm({ entry, onSuccess, onCancel }: EntryFormProps) {
  const [title, setTitle] = useState(entry?.title || "");
  const [content, setContent] = useState(entry?.content || "");
  const [type, setType] = useState(entry?.type || "ARTICLE");
  const [language, setLanguage] = useState(entry?.language || "");
  const [url, setUrl] = useState(entry?.url || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    entry?.tags?.map((t: any) => t.name) || []
  );
  const [newTag, setNewTag] = useState("");

  const { data: tagsData } = useQuery<{
    tags: Array<{ id: string; name: string; color?: string }>;
  }>(TAGS_QUERY);

  const createMutation = useMutation<{ createEntry: any }>(
    CREATE_ENTRY_MUTATION
  );
  const updateMutation = useMutation<{ updateEntry: any }>(
    UPDATE_ENTRY_MUTATION
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (entry) {
        // For updates, create input object for UpdateEntryInput
        const updateInput = {
          title,
          content,
          type,
          language: type === "CODE_SNIPPET" ? language : undefined,
          url: type === "BOOKMARK" ? url : undefined,
          tagNames: selectedTags,
        };
        await updateMutation.execute({ id: entry.id, input: updateInput });
      } else {
        // For creates, create input object for CreateEntryInput
        const createInput = {
          title,
          content,
          type,
          language: type === "CODE_SNIPPET" ? language : undefined,
          url: type === "BOOKMARK" ? url : undefined,
          tagNames: selectedTags,
        };
        await createMutation.execute({ input: createInput });
      }
      onSuccess();
    } catch (error: any) {
      console.error("Failed to save entry:", error);
      const errorMessage =
        error.message || "Failed to save entry. Please try again.";
      // Better error handling could be added here with toast notifications
      alert(errorMessage); // Temporary alert for debugging
    }
  };

  const addTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const getLanguageExtension = (lang: string) => {
    switch (lang) {
      case "javascript":
      case "typescript":
        return javascript();
      case "python":
        return python();
      default:
        return javascript();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{entry ? "Edit Entry" : "Create Entry"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entryTypes.map((entryType) => (
                  <SelectItem key={entryType.value} value={entryType.value}>
                    {entryType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "BOOKMARK" && (
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-url-here.com"
              />
            </div>
          )}

          {type === "CODE_SNIPPET" && (
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {codeLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            {type === "CODE_SNIPPET" ? (
              <CodeMirror
                value={content}
                onChange={setContent}
                extensions={[getLanguageExtension(language)]}
                theme={oneDark}
                className="border rounded-md overflow-hidden"
              />
            ) : (
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder={
                  type === "ARTICLE"
                    ? "Write your notes using Markdown..."
                    : type === "BOOKMARK"
                    ? "Add a description or notes about this bookmark..."
                    : "Enter your content..."
                }
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button type="button" onClick={addTag} disabled={!newTag}>
                Add
              </Button>
            </div>
            {tagsData?.tags && (
              <div className="flex flex-wrap gap-1">
                {tagsData.tags
                  .filter((tag) => !selectedTags.includes(tag.name))
                  .slice(0, 10)
                  .map((tag) => (
                    <Button
                      key={tag.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 bg-transparent"
                      onClick={() =>
                        setSelectedTags([...selectedTags, tag.name])
                      }
                    >
                      {tag.name}
                    </Button>
                  ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={createMutation.loading || updateMutation.loading}
            >
              {entry ? "Update" : "Create"} Entry
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
