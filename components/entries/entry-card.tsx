"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Code, Link, Trash2, Edit, Calendar } from "lucide-react";
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
}: EntryCardProps) {
  const totalRelations = entry.fromRelations.length + entry.toRelations.length;

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ARTICLE":
        return "text-primary";
      case "CODE_SNIPPET":
        return "text-accent";
      case "BOOKMARK":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getTypeGradient = (type: string) => {
    switch (type) {
      case "ARTICLE":
        return "from-primary/20 to-primary/5";
      case "CODE_SNIPPET":
        return "from-accent/20 to-accent/5";
      case "BOOKMARK":
        return "from-yellow-500/20 to-yellow-500/5";
      default:
        return "from-muted/20 to-muted/5";
    }
  };

  return (
    <Card className="group glass-effect hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer overflow-hidden">
      {/* Gradient background effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getTypeGradient(
          entry.type
        )} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      ></div>

      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div
              className={`${getTypeColor(
                entry.type
              )} transition-colors duration-200`}
            >
              {getEntryIcon(entry.type)}
            </div>
            <CardTitle
              className="text-base line-clamp-2 font-semibold text-foreground group-hover:text-primary transition-colors duration-200"
              onClick={() => onSelect(entry)}
            >
              {entry.title}
            </CardTitle>
          </div>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
              }}
              className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
              }}
              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 relative">
        <div onClick={() => onSelect(entry)} className="space-y-4">
          {renderContent()}

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs border-border/50 hover:border-primary/30 transition-colors duration-200"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}15` : undefined,
                    borderColor: tag.color ? `${tag.color}40` : undefined,
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
              {entry.tags.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs border-border/50 bg-muted/30"
                >
                  +{entry.tags.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
              {totalRelations > 0 && (
                <span className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
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
