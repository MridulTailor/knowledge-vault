"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Debounce utility
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  type: string;
  tags: Array<{ id: string; name: string; color: string | null }>;
  content: string;
  createdAt: string;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  description?: string;
  id: string;
}

interface KnowledgeGraphProps {
  entries: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    createdAt: string;
    tags: Array<{ id: string; name: string; color: string | null }>;
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
  }>;
  className?: string;
}

const relationshipColors: Record<string, string> = {
  RELATED_TO: "#64748b",
  SOURCE_FOR: "#3b82f6",
  INSPIRED_BY: "#8b5cf6",
  REFERENCES: "#06b6d4",
  CONTRADICTS: "#ef4444",
  BUILDS_ON: "#10b981",
};

const nodeTypeColors: Record<string, string> = {
  ARTICLE: "#3b82f6",
  CODE_SNIPPET: "#10b981",
  BOOKMARK: "#f59e0b",
};

export function KnowledgeGraph({ entries, className }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<GraphLink | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredNodes, setFilteredNodes] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Debounce search query to improve performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoize nodes and links to avoid recalculation
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const linkSet = new Set<string>();
    const linkArray: GraphLink[] = [];

    // Create nodes
    entries.forEach((entry) => {
      nodeMap.set(entry.id, {
        id: entry.id,
        title: entry.title,
        type: entry.type,
        tags: entry.tags,
        content: entry.content,
        createdAt: entry.createdAt,
      });
    });

    // Create links
    entries.forEach((entry) => {
      entry.fromRelations.forEach((relation) => {
        const linkId = `${entry.id}-${relation.toEntry.id}`;
        if (!linkSet.has(linkId)) {
          linkSet.add(linkId);
          linkArray.push({
            source: entry.id,
            target: relation.toEntry.id,
            type: relation.type,
            description: relation.description,
            id: relation.id,
          });
        }
      });
    });

    return {
      nodes: Array.from(nodeMap.values()),
      links: linkArray,
    };
  }, [entries]);

  // Handle search functionality with debouncing
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      const matches = new Set<string>();
      nodes.forEach((node) => {
        if (
          node.title
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase()) ||
          node.content
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase()) ||
          node.tags.some((tag) =>
            tag.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
          )
        ) {
          matches.add(node.id);
        }
      });
      setFilteredNodes(matches);
    } else {
      setFilteredNodes(new Set());
    }
  }, [debouncedSearchQuery, nodes]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(width || 800, 400),
          height: Math.max(height || 600, 400),
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Use ResizeObserver for better container size detection
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create container for all graph elements
    const container = svg.append("g");

    // Create simulation with performance optimizations
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((d) => (nodes.length > 50 ? 80 : 100))
          .strength((d) => (nodes.length > 100 ? 0.3 : 0.5))
      )
      .force(
        "charge",
        d3.forceManyBody().strength(nodes.length > 50 ? -200 : -300)
      )
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3
          .forceCollide()
          .radius((d) =>
            Math.max(20, Math.min(30, (d as GraphNode).title.length * 0.8 + 5))
          )
      )
      // Optimize for large graphs
      .alpha(nodes.length > 100 ? 0.1 : 0.3)
      .alphaDecay(nodes.length > 100 ? 0.02 : 0.0228);

    // Create definitions for gradients and filters
    const defs = svg.append("defs");

    // Create gradients for different relationship types
    Object.entries(relationshipColors).forEach(([type, color]) => {
      const gradient = defs
        .append("linearGradient")
        .attr("id", `gradient-${type}`)
        .attr("gradientUnits", "userSpaceOnUse");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.8);

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.3);
    });

    // Create glow filter
    const glowFilter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    glowFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");

    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Create stronger glow for highlighted elements
    const strongGlowFilter = defs
      .append("filter")
      .attr("id", "strong-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    strongGlowFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", "6")
      .attr("result", "coloredBlur");

    const strongMerge = strongGlowFilter.append("feMerge");
    strongMerge.append("feMergeNode").attr("in", "coloredBlur");
    strongMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Create links
    const link = container
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => relationshipColors[d.type] || "#64748b")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-dasharray", (d) =>
        d.type === "CONTRADICTS" ? "5,5" : null
      )
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        setHoveredLink(d);
        d3.select(this)
          .attr("stroke-width", 4)
          .attr("stroke-opacity", 1)
          .attr("filter", "url(#strong-glow)");

        // Highlight connected nodes
        node.style("opacity", (n) =>
          (d.source as GraphNode).id === n.id ||
          (d.target as GraphNode).id === n.id
            ? 1
            : 0.3
        );
        label.style("opacity", (n) =>
          (d.source as GraphNode).id === n.id ||
          (d.target as GraphNode).id === n.id
            ? 1
            : 0.3
        );
      })
      .on("mouseleave", function (event, d) {
        setHoveredLink(null);
        d3.select(this)
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0.6)
          .attr("filter", null);

        // Reset node and label opacity
        node.style("opacity", 1);
        label.style("opacity", 1);
      });

    // Create nodes
    const node = container
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => Math.max(15, Math.min(25, d.title.length * 0.8)))
      .attr("fill", (d) => nodeTypeColors[d.type] || "#64748b")
      .attr("stroke", (d) =>
        filteredNodes.size > 0 && filteredNodes.has(d.id)
          ? "#fbbf24"
          : "#ffffff"
      )
      .attr("stroke-width", (d) =>
        filteredNodes.size > 0 && filteredNodes.has(d.id) ? 3 : 2
      )
      .style("opacity", (d) =>
        filteredNodes.size > 0 ? (filteredNodes.has(d.id) ? 1 : 0.3) : 1
      )
      .style("cursor", "pointer")
      .style("transition", "all 0.2s ease")
      .call(
        d3
          .drag<any, GraphNode>()
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded)
      )
      .on("mouseenter", function (event, d) {
        setHoveredNode(d);
        d3.select(this)
          .attr("r", Math.max(20, Math.min(30, d.title.length * 1)))
          .attr("stroke-width", 3)
          .attr("filter", "url(#strong-glow)");

        // Highlight connected links
        link.style("opacity", (l) =>
          (l.source as GraphNode).id === d.id ||
          (l.target as GraphNode).id === d.id
            ? 1
            : 0.2
        );

        // Highlight connected nodes
        node.style("opacity", (n) => {
          if (n.id === d.id) return 1;
          const isConnected = links.some(
            (l) =>
              ((l.source as GraphNode).id === d.id &&
                (l.target as GraphNode).id === n.id) ||
              ((l.target as GraphNode).id === d.id &&
                (l.source as GraphNode).id === n.id)
          );
          return isConnected ? 0.8 : 0.3;
        });
      })
      .on("mouseleave", function (event, d) {
        setHoveredNode(null);
        d3.select(this)
          .attr("r", Math.max(15, Math.min(25, d.title.length * 0.8)))
          .attr("stroke-width", 2)
          .attr("filter", null);

        // Reset opacity
        link.style("opacity", 1);
        node.style("opacity", 1);
      })
      .on("click", function (event, d) {
        setSelectedNode(d);
      });

    // Create labels
    const label = container
      .append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) =>
        d.title.length > 20 ? d.title.substring(0, 17) + "..." : d.title
      )
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("fill", "hsl(var(--foreground))")
      .attr("text-anchor", "middle")
      .attr("dy", -30)
      .style("pointer-events", "none")
      .style("user-select", "none");

    // Update positions on simulation tick with throttling for performance
    let tickCount = 0;
    simulation.on("tick", () => {
      // Throttle rendering for large graphs
      if (nodes.length > 100 && tickCount % 2 !== 0) {
        tickCount++;
        return;
      }

      link
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);

      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);

      label.attr("x", (d) => d.x!).attr("y", (d) => d.y!);

      tickCount++;
    });

    // Drag functions
    function dragStarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragEnded(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Zoom controls
    const zoomIn = () => {
      svg.transition().call(zoom.scaleBy, 1.5);
    };

    const zoomOut = () => {
      svg.transition().call(zoom.scaleBy, 1 / 1.5);
    };

    const resetZoom = () => {
      svg.transition().call(zoom.transform, d3.zoomIdentity);
    };

    // Store zoom functions for external use
    (svgRef.current as any)._zoomIn = zoomIn;
    (svgRef.current as any)._zoomOut = zoomOut;
    (svgRef.current as any)._resetZoom = resetZoom;

    return () => {
      simulation.stop();
    };
  }, [nodes, links, dimensions, filteredNodes]);

  const zoomIn = () => (svgRef.current as any)?._zoomIn?.();
  const zoomOut = () => (svgRef.current as any)?._zoomOut?.();
  const resetZoom = () => (svgRef.current as any)?._resetZoom?.();

  if (entries.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-96 border rounded-lg bg-card",
          className
        )}
      >
        <p className="text-muted-foreground">
          No entries to display in the knowledge graph.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div
        ref={containerRef}
        className={cn(
          "relative border rounded-lg overflow-hidden bg-card transition-all duration-300",
          isFullscreen
            ? "fixed inset-4 z-50 w-auto h-auto shadow-2xl"
            : "w-full h-[80vh] min-h-[600px]"
        )}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="absolute inset-0"
        />

        {/* Stats Panel */}
        <div className="absolute top-4 left-4 bg-card border rounded-lg p-3 shadow-lg z-10">
          <h4 className="font-semibold text-sm mb-2">Graph Stats</h4>
          <div className="text-xs space-y-1">
            <div>
              Nodes: <span className="font-medium">{nodes.length}</span>
            </div>
            <div>
              Links: <span className="font-medium">{links.length}</span>
            </div>
            {filteredNodes.size > 0 && (
              <div>
                Filtered:{" "}
                <span className="font-medium text-amber-600">
                  {filteredNodes.size}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-8 pr-8 text-xs bg-card/95 backdrop-blur border-border/50"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            {searchQuery && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={zoomIn}
              className="hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={zoomOut}
              className="hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={resetZoom}
              className="hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card border rounded-lg p-3 shadow-lg z-10 max-w-xs max-h-[calc(100vh-200px)] overflow-y-auto">
          <h4 className="font-semibold text-sm mb-2 sticky top-0 bg-card">
            Legend
          </h4>

          <div className="mb-3">
            <h5 className="font-medium text-xs mb-1">Node Types</h5>
            <div className="flex flex-col gap-1">
              {Object.entries(nodeTypeColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize">
                    {type.replace("_", " ").toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h5 className="font-medium text-xs mb-1">Relationships</h5>
            <div className="flex flex-col gap-1">
              {Object.entries(relationshipColors)
                .slice(0, 4)
                .map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-4 h-0.5 flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="capitalize text-xs">
                      {type.replace("_", " ").toLowerCase()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Hovered Node Info */}
        {hoveredNode && (
          <div className="absolute top-4 left-4 bg-card border rounded-lg p-4 shadow-lg max-w-sm z-20">
            <h3 className="font-semibold text-sm mb-2">{hoveredNode.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">
              {hoveredNode.content.substring(0, 100)}
              {hoveredNode.content.length > 100 ? "..." : ""}
            </p>
            <div className="flex flex-wrap gap-1">
              {hoveredNode.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Hovered Link Info */}
        {hoveredLink && (
          <div className="absolute top-20 left-4 bg-card border rounded-lg p-3 shadow-lg z-20">
            <p className="text-xs font-medium">
              Relationship:{" "}
              <span className="capitalize">
                {hoveredLink.type.replace("_", " ").toLowerCase()}
              </span>
            </p>
            {hoveredLink.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {hoveredLink.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Selected Node Detail */}
      {selectedNode && (
        <Card className="mt-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">{selectedNode.title}</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedNode(null)}
              className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
            >
              ×
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {selectedNode.content}
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedNode.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Created: {new Date(selectedNode.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
