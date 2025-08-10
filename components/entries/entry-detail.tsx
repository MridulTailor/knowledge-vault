"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Code,
  Link,
  Edit,
  Trash2,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Plus,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { RelationshipForm } from "@/components/relationships/relationship-form";

interface EntryDetailProps {
  entry: {
    id: string;
    title: string;
    content: string;
    type: string;
    language?: string;
    url?: string;
    createdAt: string;
    updatedAt: string;
    tags: Array<{ id: string; name: string; color?: string }>;
    fromRelations: Array<{
      id: string;
      type: string;
      description?: string;
      toEntry: { id: string; title: string };
    }>;
    toRelations: Array<{
      id: string;
      type: string;
      description?: string;
      fromEntry: { id: string; title: string };
    }>;
  };
  onEdit: (entry: any) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  onNavigateToEntry: (entryId: string) => void;
  onRefresh?: () => void;
}

const getEntryIcon = (type: string) => {
  switch (type) {
    case "ARTICLE":
      return <BookOpen className="h-5 w-5" />;
    case "CODE_SNIPPET":
      return <Code className="h-5 w-5" />;
    case "BOOKMARK":
      return <Link className="h-5 w-5" />;
    default:
      return <BookOpen className="h-5 w-5" />;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getLanguageExtension = (lang?: string) => {
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

export function EntryDetail({
  entry,
  onEdit,
  onDelete,
  onBack,
  onNavigateToEntry,
  onRefresh,
}: EntryDetailProps) {
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);

  const handleRelationshipSuccess = () => {
    setShowRelationshipForm(false);
    onRefresh?.();
  };
  const renderContent = () => {
    if (entry.type === "BOOKMARK") {
      return (
        <div className="space-y-4">
          {entry.url && (
            <div className="p-4 bg-muted rounded-lg">
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {entry.url}
              </a>
            </div>
          )}
          {entry.content && (
            <div className="prose max-w-none">
              <ReactMarkdown>{entry.content}</ReactMarkdown>
            </div>
          )}
        </div>
      );
    }

    if (entry.type === "CODE_SNIPPET") {
      return (
        <div className="space-y-4">
          {entry.language && (
            <Badge variant="secondary">{entry.language}</Badge>
          )}
          <CodeMirror
            value={entry.content}
            extensions={[getLanguageExtension(entry.language)]}
            theme={oneDark}
            editable={false}
            className="border rounded-md overflow-hidden"
          />
        </div>
      );
    }

    return (
      <div className="prose max-w-none">
        <ReactMarkdown>{entry.content}</ReactMarkdown>
      </div>
    );
  };

  if (showRelationshipForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowRelationshipForm(false)}
          >
            ← Back to Entry
          </Button>
        </div>
        <RelationshipForm
          fromEntryId={entry.id}
          onSuccess={handleRelationshipSuccess}
          onCancel={() => setShowRelationshipForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => onEdit(entry)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRelationshipForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Relationship
          </Button>
          <Button variant="outline" onClick={() => onDelete(entry.id)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start space-x-3">
            {getEntryIcon(entry.type)}
            <div className="flex-1">
              <CardTitle className="text-2xl">{entry.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(entry.createdAt)}</span>
                </div>
                {entry.updatedAt !== entry.createdAt && (
                  <span>• Updated {formatDate(entry.updatedAt)}</span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : undefined,
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Content */}
          {renderContent()}
        </CardContent>
      </Card>

      {/* Relationships */}
      {(entry.fromRelations.length > 0 || entry.toRelations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Relationships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {entry.fromRelations.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center">
                  <ArrowRight className="h-4 w-4 mr-1" />
                  This entry links to:
                </h4>
                <div className="space-y-2">
                  {entry.fromRelations.map((relation) => (
                    <div
                      key={relation.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onNavigateToEntry(relation.toEntry.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {relation.toEntry.title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {relation.type.toLowerCase().replace("_", " ")}
                        </Badge>
                      </div>
                      {relation.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {relation.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entry.toRelations.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Linked from:
                </h4>
                <div className="space-y-2">
                  {entry.toRelations.map((relation) => (
                    <div
                      key={relation.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onNavigateToEntry(relation.fromEntry.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {relation.fromEntry.title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {relation.type.toLowerCase().replace("_", " ")}
                        </Badge>
                      </div>
                      {relation.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {relation.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
