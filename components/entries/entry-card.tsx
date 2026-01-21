"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Code, Link, Trash2, Edit, Calendar, FolderPlus } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface EntryCardProps {
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
      type?: string;
      description?: string;
      toEntry: { id: string; title: string };
    }>;
    toRelations: Array<{
      id: string;
      type?: string;
      description?: string;
      fromEntry: { id: string; title: string };
    }>;
  };
  onEdit: (entry: any) => void;
  onDelete: (id: string) => void;
  onSelect: (entry: any) => void;
  onAddToCollection?: (id: string) => void;
}

const getEntryIcon = (type: string) => {
  switch (type) {
    case "ARTICLE":
      return <BookOpen className="h-4 w-4" />;
    case "CODE_SNIPPET":
      return <Code className="h-4 w-4" />;
    case "BOOKMARK":
      return <Link className="h-4 w-4" />;
    default:
      return <BookOpen className="h-4 w-4" />;
  }
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string:", dateString);
      return "Unknown date";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.warn("Error parsing date:", dateString, error);
    return "Unknown date";
  }
};

export function EntryCard({
  entry,
  onEdit,
  onDelete,
  onSelect,
  onAddToCollection,
}: EntryCardProps) {
  const totalRelations = (entry.fromRelations?.length || 0) + (entry.toRelations?.length || 0);

  const renderContent = () => {
    if (entry.type === "BOOKMARK" && entry.url) {
      return (
        <div className="space-y-3">
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
          >
            <Link className="h-3 w-3" />
            <span className="truncate">{new URL(entry.url).hostname}</span>
          </a>
          {entry.content && (
            <div className="text-sm text-muted-foreground line-clamp-3">
              {entry.content}
            </div>
          )}
        </div>
      );
    }

    if (entry.type === "CODE_SNIPPET") {
      return (
        <div className="space-y-3">
          {entry.language && (
            <Badge
              variant="secondary"
              className="text-xs bg-accent/10 text-accent border-accent/20"
            >
              {entry.language}
            </Badge>
          )}
          <div className="relative">
            <pre className="text-xs bg-muted/50 border border-border/50 p-3 rounded-lg overflow-hidden font-mono">
              <code className="line-clamp-4 text-foreground">
                {entry.content}
              </code>
            </pre>
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="prose prose-sm max-w-none line-clamp-3 text-sm text-muted-foreground">
        <div className="[&>*]:m-0 [&>*]:leading-relaxed">
          <ReactMarkdown>{entry.content}</ReactMarkdown>
        </div>
      </div>
    );
  };



  return (
    <Card className="group relative hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="text-accent/80">
              {getEntryIcon(entry.type)}
            </div>
            <CardTitle
              className="text-base line-clamp-2 font-semibold"
              onClick={() => onSelect(entry)}
            >
              {entry.title}
            </CardTitle>
          </div>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCollection?.(entry.id);
              }}
              className="h-8 w-8 p-0"
              title="Add to Collection"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
              }}
              className="h-8 w-8 p-0 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div onClick={() => onSelect(entry)} className="space-y-4">
          {renderContent()}

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {tag.name}
                </Badge>
              ))}
              {entry.tags.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs font-normal"
                >
                  +{entry.tags.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
              {totalRelations > 0 && (
                <span className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>
                    {totalRelations} link{totalRelations !== 1 ? "s" : ""}
                  </span>
                </span>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(entry.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
