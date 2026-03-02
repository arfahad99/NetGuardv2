import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Interface representing network health data structure
 * Contains metrics and context information for network monitoring
 */
interface NetworkHealthData {
  metrics?: {
    bandwidth?: {
      upload_mbps?: number;
      download_mbps?: number;
    };
    latency_ms?: number;
    packet_loss_percent?: number;
    uptime_percent?: number;
  };
  context?: {
    site?: string;
    interface?: string;
  };
}

/**
 * Interface representing a point on the graph
 * x: horizontal position (0-100%)
 * y: actual metric value
 */
interface GraphPoint {
  x: number;
  y: number;
}

/**
 * Network Health Graph Component
 * 
 * Displays animated SVG-based graphs for network health metrics including:
 * - Bandwidth (upload + download)
 * - Latency
 * - Packet Loss
 * - Uptime
 * 
 * Features:
 * - Smooth bezier curve animations
 * - Gradient fills
 * - Interactive data points
 * - Auto-scaling Y-axis
 * - Responsive design
 */
@Component({
  selector: 'app-network-health-graph',
  imports: [CommonModule],
  templateUrl: './network-health-graph.component.html',
  styleUrls: ['./network-health-graph.component.css']
})
export class NetworkHealthGraphComponent implements OnInit, OnChanges {
  /** Array of network health data to display */
  @Input() data: NetworkHealthData[] = [];

  /** Type of metric to display */
  @Input() metric: 'bandwidth' | 'latency' | 'packet_loss' | 'uptime' = 'bandwidth';

  /** Height of the graph in pixels */
  @Input() height: number = 300;

  graphPoints: GraphPoint[] = [];
  maxValue: number = 100;
  minValue: number = 0;
  pathData: string = '';
  areaPathData: string = '';
  gridLines: number[] = [0, 25, 50, 75, 100];
  animationProgress: number = 0;

  ngOnInit() {
    this.updateGraph();
  }

  ngOnChanges() {
    this.updateGraph();
  }

  /**
   * Main update method that orchestrates graph rendering
   * Generates demo data if no real data is available
   */
  updateGraph() {
    if (!this.data || this.data.length === 0) {
      this.generateDemoData();
      return;
    }

    this.extractDataPoints();
    this.calculateBounds();
    this.generatePath();
    this.animatePath();
  }

  /**
   * Generates demo data when no real data is available
   */
  generateDemoData() {
    const ranges = {
      bandwidth: { min: 50, max: 100 },
      latency: { min: 10, max: 50 },
      packet_loss: { min: 0, max: 5 },
      uptime: { min: 95, max: 100 }
    };

    const range = ranges[this.metric];
    const demoData = Array.from({ length: 20 }, () =>
      range.min + Math.random() * (range.max - range.min)
    );

    this.graphPoints = demoData.map((value, index) => ({
      x: (index / 19) * 100,
      y: value
    }));

    this.calculateBounds();
    this.generatePath();
    this.animatePath();
  }

  /**
   * Extracts data points from network health records
   */
  extractDataPoints() {
    const values = this.data.map((record: any) => {
      // If data is from DynamoDB probe endpoint (has deviceId)
      if (record.deviceId !== undefined) {
        switch (this.metric) {
          case 'bandwidth':
            return (record.downloadMbps || 0) + (record.uploadMbps || 0);
          case 'latency':
            return record.latencyMs || 0;
          case 'packet_loss':
            return record.packetLoss || 0;
          case 'uptime':
            return record.uptimeStatus === 'online' ? 100 : 0;
        }
      }
      // If data is from MongoDB backend (has metrics object)
      else {
        const metrics = record.metrics;
        switch (this.metric) {
          case 'bandwidth':
            return (metrics?.bandwidth?.download_mbps || 0) + (metrics?.bandwidth?.upload_mbps || 0);
          case 'latency':
            return metrics?.latency_ms || 0;
          case 'packet_loss':
            return metrics?.packet_loss_percent || 0;
          case 'uptime':
            return metrics?.uptime_percent || 0;
        }
      }
    });

    this.graphPoints = values.map((value, index) => ({
      x: (index / Math.max(values.length - 1, 1)) * 100,
      y: value
    }));
  }

  /**
   * Calculates Y-axis bounds with 10% padding
   */
  calculateBounds() {
    if (this.graphPoints.length === 0) return;

    const values = this.graphPoints.map(p => p.y);
    const range = Math.max(...values) - Math.min(...values);

    this.maxValue = Math.max(...values) + range * 0.1;
    this.minValue = Math.max(0, Math.min(...values) - range * 0.1);

    // Create 5 evenly spaced grid lines
    const step = (this.maxValue - this.minValue) / 4;
    this.gridLines = Array.from({ length: 5 }, (_, i) => this.minValue + step * i);
  }

  /**
   * Generates SVG path with smooth bezier curves
   */
  generatePath() {
    if (this.graphPoints.length === 0) return;

    const points = this.graphPoints.map(p => ({ x: p.x, y: this.normalizeY(p.y) }));
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const controlX = (points[i].x + points[i + 1].x) / 2;
      path += ` Q ${controlX} ${points[i].y}, ${points[i + 1].x} ${points[i + 1].y}`;
    }

    this.pathData = path;
    this.areaPathData = `${path} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;
  }

  /**
   * Converts value to SVG Y coordinate (inverted)
   */
  normalizeY(value: number): number {
    const range = this.maxValue - this.minValue;
    return range === 0 ? 50 : 100 - ((value - this.minValue) / range) * 100;
  }

  /**
   * Animates path drawing over 1.5 seconds
   */
  animatePath() {
    const startTime = Date.now();
    const animate = () => {
      this.animationProgress = Math.min((Date.now() - startTime) / 1500, 1);
      if (this.animationProgress < 1) requestAnimationFrame(animate);
    };
    animate();
  }

  getMetricLabel(): string {
    const labels = {
      bandwidth: 'Bandwidth (Mbps)',
      latency: 'Latency (ms)',
      packet_loss: 'Packet Loss (%)',
      uptime: 'Uptime (%)'
    };
    return labels[this.metric];
  }

  getMetricColor(): string {
    const colors = {
      bandwidth: '#667eea',
      latency: '#f2c94c',
      packet_loss: '#f45c43',
      uptime: '#38ef7d'
    };
    return colors[this.metric];
  }

  getGradientId(): string {
    return `gradient-${this.metric}`;
  }
}
