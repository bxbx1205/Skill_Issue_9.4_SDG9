import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import DownloadIcon from '@mui/icons-material/Download';
import PreviewIcon from '@mui/icons-material/Preview';
import CloseIcon from '@mui/icons-material/Close';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart, registerables } from 'chart.js';
import { format } from 'date-fns';

Chart.register(...registerables);

// Premium color palette
const COLORS = {
  primary: '#1a2332',
  secondary: '#2d3748',
  accent: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  pink: '#ec4899',
  gradient1: '#667eea',
  gradient2: '#764ba2',
  lightBg: '#f8fafc',
  darkText: '#1a202c',
  mutedText: '#64748b',
};

// Helper function to create chart image
const createChartImage = (config, width = 400, height = 250) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const chart = new Chart(ctx, config);

    setTimeout(() => {
      const imageData = canvas.toDataURL('image/png');
      chart.destroy();
      resolve(imageData);
    }, 100);
  });
};

// Generate Premium PDF Report
const generateReport = async (recordedData, sessionInfo) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper functions
  const addNewPage = () => {
    pdf.addPage();
    yPos = margin;
    addFooter();
  };

  const addFooter = () => {
    const pageNum = pdf.internal.getNumberOfPages();
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text('CIH Predictive Maintenance System', margin, pageHeight - 10);
    pdf.text(format(new Date(), 'MMM dd, yyyy'), pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // Process data for statistics
  const allMachines = new Map();
  const timeLabels = [];

  recordedData.forEach((snapshot, index) => {
    timeLabels.push(format(new Date(snapshot.timestamp), 'HH:mm:ss'));
    snapshot.machines.forEach((machine) => {
      if (!allMachines.has(machine.id)) {
        allMachines.set(machine.id, {
          name: machine.name,
          type: machine.type,
          temperatures: [],
          vibrations: [],
          failureRisks: [],
          healthScores: [],
          gasLevels: [],
        });
      }
      const m = allMachines.get(machine.id);
      m.temperatures.push(machine.temperature || 0);
      m.vibrations.push(machine.vibration || 0);
      m.failureRisks.push(machine.failureRisk || 0);
      m.healthScores.push(machine.healthScore || 100);
      if (machine.gasLevel !== undefined) m.gasLevels.push(machine.gasLevel);
    });
  });

  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const max = (arr) => arr.length ? Math.max(...arr) : 0;
  const min = (arr) => arr.length ? Math.min(...arr) : 0;

  const machineStats = Array.from(allMachines.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    type: data.type,
    avgTemp: avg(data.temperatures),
    maxTemp: max(data.temperatures),
    avgVibration: avg(data.vibrations),
    maxVibration: max(data.vibrations),
    avgRisk: avg(data.failureRisks),
    maxRisk: max(data.failureRisks),
    avgHealth: avg(data.healthScores),
    minHealth: min(data.healthScores),
    avgGas: data.gasLevels.length ? avg(data.gasLevels) : null,
  }));

  // Calculate session duration
  const sessionDuration = sessionInfo.endTime
    ? (sessionInfo.endTime - sessionInfo.startTime) / 1000
    : 0;

  // ========== COVER PAGE ==========
  // Background gradient header
  pdf.setFillColor(26, 35, 50);
  pdf.rect(0, 0, pageWidth, 100, 'F');

  // Accent line
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 100, pageWidth, 3, 'F');

  // Title
  pdf.setFontSize(32);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Predictive Maintenance', pageWidth / 2, 40, { align: 'center' });

  pdf.setFontSize(24);
  pdf.setTextColor(59, 130, 246);
  pdf.text('Technical Research Report', pageWidth / 2, 55, { align: 'center' });

  // Subtitle
  pdf.setFontSize(12);
  pdf.setTextColor(200, 200, 200);
  pdf.text('AI-Powered Industrial Monitoring & Analytics', pageWidth / 2, 70, { align: 'center' });

  // Report date and info
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, pageWidth / 2, 85, { align: 'center' });

  // Key Metrics Cards
  yPos = 120;
  const cardWidth = 40;
  const cardHeight = 35;
  const cardGap = 8;
  const startX = (pageWidth - (4 * cardWidth + 3 * cardGap)) / 2;

  const metrics = [
    { label: 'Machines', value: machineStats.length, color: [59, 130, 246] },
    { label: 'Data Points', value: recordedData.length, color: [16, 185, 129] },
    { label: 'Duration', value: `${Math.round(sessionDuration)}s`, color: [139, 92, 246] },
    { label: 'Alerts', value: machineStats.filter(m => m.maxRisk >= 50).length, color: [239, 68, 68] },
  ];

  metrics.forEach((metric, i) => {
    const x = startX + i * (cardWidth + cardGap);

    // Card background
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'F');

    // Top accent
    pdf.setFillColor(...metric.color);
    pdf.rect(x, yPos, cardWidth, 3, 'F');

    // Value
    pdf.setFontSize(18);
    pdf.setTextColor(26, 32, 44);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(metric.value), x + cardWidth / 2, yPos + 18, { align: 'center' });

    // Label
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.text(metric.label, x + cardWidth / 2, yPos + 28, { align: 'center' });
  });

  // Session Information Box
  yPos = 175;
  pdf.setFillColor(241, 245, 249);
  pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 50, 3, 3, 'F');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 35, 50);
  pdf.text('Session Information', margin + 10, yPos + 12);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);

  const sessionDetails = [
    ['Start Time:', format(new Date(sessionInfo.startTime), 'MMM dd, yyyy HH:mm:ss')],
    ['End Time:', sessionInfo.endTime ? format(new Date(sessionInfo.endTime), 'MMM dd, yyyy HH:mm:ss') : 'N/A'],
    ['Total Duration:', `${Math.floor(sessionDuration / 60)}m ${Math.round(sessionDuration % 60)}s`],
    ['Sample Interval:', '~2 seconds'],
  ];

  sessionDetails.forEach((detail, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xOffset = col * 85;
    pdf.setFont('helvetica', 'bold');
    pdf.text(detail[0], margin + 10 + xOffset, yPos + 25 + row * 12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(detail[1], margin + 45 + xOffset, yPos + 25 + row * 12);
  });

  // Technology Stack
  yPos = 240;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 35, 50);
  pdf.text('Technology Stack', margin, yPos);

  const techStack = ['React.js', 'Three.js', 'TensorFlow', 'Arduino IoT', 'Node.js', 'Chart.js'];
  yPos += 10;

  techStack.forEach((tech, i) => {
    const x = margin + (i % 3) * 60;
    const y = yPos + Math.floor(i / 3) * 12;

    pdf.setFillColor(59, 130, 246);
    pdf.circle(x + 2, y - 1.5, 1.5, 'F');

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text(tech, x + 6, y);
  });

  // SDG Badge
  yPos = 275;
  pdf.setFillColor(16, 185, 129);
  pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 2, 2, 'F');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('🎯 Supporting UN SDG 9: Industry, Innovation and Infrastructure', pageWidth / 2, yPos + 10, { align: 'center' });

  addFooter();

  // ========== EXECUTIVE SUMMARY PAGE ==========
  addNewPage();

  pdf.setFillColor(26, 35, 50);
  pdf.rect(0, 0, pageWidth, 25, 'F');

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Executive Summary', margin, 17);

  yPos = 40;

  // Find critical findings
  const criticalMachines = machineStats.filter(m => m.maxRisk >= 50);
  const warningMachines = machineStats.filter(m => m.maxRisk >= 15 && m.maxRisk < 50);
  const highTempMachines = machineStats.filter(m => m.maxTemp > 60);
  const highVibrationMachines = machineStats.filter(m => m.maxVibration > 0.5);

  const summaryText = `This report analyzes ${machineStats.length} industrial machines monitored over ${Math.round(sessionDuration)} seconds. ` +
    `During the observation period, ${recordedData.length} data samples were collected. ` +
    `${criticalMachines.length} machine(s) reached critical risk levels (≥50%), ` +
    `${warningMachines.length} showed warning indicators, ` +
    `${highTempMachines.length} experienced high temperatures (>60°C), and ` +
    `${highVibrationMachines.length} showed elevated vibration levels (>0.5 units).`;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(51, 65, 85);
  const splitSummary = pdf.splitTextToSize(summaryText, pageWidth - 2 * margin);
  pdf.text(splitSummary, margin, yPos);

  yPos += splitSummary.length * 5 + 15;

  // Key Findings Box
  pdf.setFillColor(254, 243, 199);
  pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 45, 3, 3, 'F');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(146, 64, 14);
  pdf.text('⚡ Key Findings', margin + 5, yPos + 10);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(113, 63, 18);

  const findings = [
    `• Average Risk Level: ${(machineStats.reduce((sum, m) => sum + m.avgRisk, 0) / machineStats.length).toFixed(1)}%`,
    `• Peak Temperature Recorded: ${Math.max(...machineStats.map(m => m.maxTemp)).toFixed(1)}°C`,
    `• Maximum Vibration: ${Math.max(...machineStats.map(m => m.maxVibration)).toFixed(3)} units`,
    `• System Health Average: ${(machineStats.reduce((sum, m) => sum + m.avgHealth, 0) / machineStats.length).toFixed(1)}%`,
  ];

  findings.forEach((finding, i) => {
    pdf.text(finding, margin + 5, yPos + 20 + i * 6);
  });

  yPos += 60;

  // Risk Distribution Bar
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 35, 50);
  pdf.text('Risk Distribution Overview', margin, yPos);
  yPos += 8;

  const barWidth = pageWidth - 2 * margin;
  const barHeight = 15;
  const safeCount = machineStats.filter(m => m.maxRisk < 15).length;
  const total = machineStats.length || 1;

  const safePct = safeCount / total;
  const warnPct = warningMachines.length / total;
  const critPct = criticalMachines.length / total;

  // Safe (green)
  pdf.setFillColor(16, 185, 129);
  pdf.rect(margin, yPos, barWidth * safePct, barHeight, 'F');

  // Warning (yellow)
  pdf.setFillColor(245, 158, 11);
  pdf.rect(margin + barWidth * safePct, yPos, barWidth * warnPct, barHeight, 'F');

  // Critical (red)
  pdf.setFillColor(239, 68, 68);
  pdf.rect(margin + barWidth * (safePct + warnPct), yPos, barWidth * critPct, barHeight, 'F');

  yPos += barHeight + 5;

  // Legend
  const legend = [
    { label: `Safe (${safeCount})`, color: [16, 185, 129] },
    { label: `Warning (${warningMachines.length})`, color: [245, 158, 11] },
    { label: `Critical (${criticalMachines.length})`, color: [239, 68, 68] },
  ];

  legend.forEach((item, i) => {
    const x = margin + i * 55;
    pdf.setFillColor(...item.color);
    pdf.rect(x, yPos, 10, 5, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(item.label, x + 13, yPos + 4);
  });

  // ========== CHARTS PAGE 1 - Risk & Temperature ==========
  addNewPage();

  pdf.setFillColor(26, 35, 50);
  pdf.rect(0, 0, pageWidth, 25, 'F');

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Data Visualization & Analytics', margin, 17);

  yPos = 35;

  // Chart 1: Risk Over Time
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 35, 50);
  pdf.text('1. Failure Risk Trends Over Time', margin, yPos);
  yPos += 5;

  const riskOverTime = {};
  machineStats.forEach((m) => {
    const machineData = allMachines.get(m.id);
    riskOverTime[m.name] = machineData.failureRisks;
  });

  const riskChartConfig = {
    type: 'line',
    data: {
      labels: timeLabels.slice(0, 50),
      datasets: machineStats.slice(0, 6).map((m, i) => ({
        label: m.name,
        data: allMachines.get(m.id).failureRisks.slice(0, 50),
        borderColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
        ][i],
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
      })),
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 9 } } },
        title: { display: false },
      },
      scales: {
        y: { title: { display: true, text: 'Risk %' }, min: 0, max: 100 },
        x: { title: { display: true, text: 'Time' }, ticks: { maxTicksLimit: 10 } },
      },
    },
  };

  const riskChartImg = await createChartImage(riskChartConfig, 350, 200);
  pdf.addImage(riskChartImg, 'PNG', margin, yPos, pageWidth - 2 * margin, 80);
  yPos += 90;

  // Chart 2: Temperature Over Time
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 35, 50);
  pdf.text('2. Temperature Monitoring', margin, yPos);
  yPos += 5;

  const tempChartConfig = {
    type: 'line',
    data: {
      labels: timeLabels.slice(0, 50),
      datasets: machineStats.slice(0, 6).map((m, i) => ({
        label: m.name,
        data: allMachines.get(m.id).temperatures.slice(0, 50),
        borderColor: [
          '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4'
        ][i],
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
      })),
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 9 } } },
      },
      scales: {
        y: { title: { display: true, text: 'Temperature °C' } },
        x: { title: { display: true, text: 'Time' }, ticks: { maxTicksLimit: 10 } },
      },
    },
  };

  const tempChartImg = await createChartImage(tempChartConfig, 350, 200);
  pdf.addImage(tempChartImg, 'PNG', margin, yPos, pageWidth - 2 * margin, 80);

  // ========== CHARTS PAGE 2 - Vibration & Comparisons ==========
  addNewPage();

  pdf.setFillColor(26, 35, 50);
  pdf.rect(0, 0, pageWidth, 25, 'F');

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Comparative Analysis', margin, 17);

  yPos = 35;

  // Chart 3: Vibration Over Time
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 35, 50);
  pdf.text('3. Vibration Analysis', margin, yPos);
  yPos += 5;

  const vibrationChartConfig = {
    type: 'line',
    data: {
      labels: timeLabels.slice(0, 50),
      datasets: machineStats.slice(0, 6).map((m, i) => ({
        label: m.name,
        data: allMachines.get(m.id).vibrations.slice(0, 50),
        borderColor: [
          '#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'
        ][i],
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
      })),
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 9 } } },
      },
      scales: {
        y: { title: { display: true, text: 'Vibration Units' } },
        x: { title: { display: true, text: 'Time' }, ticks: { maxTicksLimit: 10 } },
      },
    },
  };

  const vibrationChartImg = await createChartImage(vibrationChartConfig, 350, 200);
  pdf.addImage(vibrationChartImg, 'PNG', margin, yPos, pageWidth - 2 * margin, 80);
  yPos += 90;

  // Chart 4: Bar Chart - Average Risk by Machine
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 35, 50);
  pdf.text('4. Average Risk Comparison by Machine', margin, yPos);
  yPos += 5;

  const barChartConfig = {
    type: 'bar',
    data: {
      labels: machineStats.map(m => m.name.substring(0, 10)),
      datasets: [{
        label: 'Avg Risk %',
        data: machineStats.map(m => m.avgRisk),
        backgroundColor: machineStats.map(m =>
          m.avgRisk >= 50 ? '#ef4444' : m.avgRisk >= 15 ? '#f59e0b' : '#10b981'
        ),
        borderRadius: 4,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { title: { display: true, text: 'Risk %' }, min: 0, max: 100 },
        x: { ticks: { maxRotation: 45 } },
      },
    },
  };

  const barChartImg = await createChartImage(barChartConfig, 350, 200);
  pdf.addImage(barChartImg, 'PNG', margin, yPos, pageWidth - 2 * margin, 80);

  // ========== CHARTS PAGE 3 - More Analysis ==========
  addNewPage();

  pdf.setFillColor(26, 35, 50);
  pdf.rect(0, 0, pageWidth, 25, 'F');

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Additional Analytics', margin, 17);

  yPos = 35;

  // Chart 5: Temperature vs Vibration Bar
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 35, 50);
  pdf.text('5. Max Temperature vs Max Vibration', margin, yPos);
  yPos += 5;

  const comparisonChartConfig = {
    type: 'bar',
    data: {
      labels: machineStats.map(m => m.name.substring(0, 8)),
      datasets: [
        {
          label: 'Max Temp (°C)',
          data: machineStats.map(m => m.maxTemp),
          backgroundColor: '#ef4444',
          borderRadius: 4,
        },
        {
          label: 'Max Vibration (x100)',
          data: machineStats.map(m => m.maxVibration * 100),
          backgroundColor: '#8b5cf6',
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 9 } } },
      },
      scales: {
        y: { title: { display: true, text: 'Value' } },
      },
    },
  };

  const comparisonChartImg = await createChartImage(comparisonChartConfig, 350, 200);
  pdf.addImage(comparisonChartImg, 'PNG', margin, yPos, pageWidth - 2 * margin, 80);
  yPos += 90;

  // Chart 6: Doughnut - Health Distribution
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 35, 50);
  pdf.text('6. Overall System Health Distribution', margin, yPos);
  yPos += 5;

  const healthGood = machineStats.filter(m => m.avgHealth >= 80).length;
  const healthMedium = machineStats.filter(m => m.avgHealth >= 50 && m.avgHealth < 80).length;
  const healthPoor = machineStats.filter(m => m.avgHealth < 50).length;

  const doughnutConfig = {
    type: 'doughnut',
    data: {
      labels: ['Good (≥80%)', 'Medium (50-79%)', 'Poor (<50%)'],
      datasets: [{
        data: [healthGood, healthMedium, healthPoor],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff',
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 15, font: { size: 10 } } },
      },
    },
  };

  const doughnutImg = await createChartImage(doughnutConfig, 300, 200);
  pdf.addImage(doughnutImg, 'PNG', margin + 20, yPos, 150, 75);

  // ========== STATISTICS TABLE PAGE ==========
  addNewPage();

  pdf.setFillColor(26, 35, 50);
  pdf.rect(0, 0, pageWidth, 25, 'F');

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Detailed Statistics', margin, 17);

  yPos = 35;

  // Machine Statistics Table
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 35, 50);
  pdf.text('Machine Performance Summary', margin, yPos);
  yPos += 8;

  const tableData = machineStats.map(m => [
    m.name,
    m.type || 'N/A',
    `${m.avgTemp.toFixed(1)}°C`,
    `${m.maxTemp.toFixed(1)}°C`,
    m.avgVibration.toFixed(3),
    `${m.avgRisk.toFixed(1)}%`,
    `${m.maxRisk.toFixed(1)}%`,
    `${m.avgHealth.toFixed(1)}%`,
  ]);

  autoTable(pdf, {
    startY: yPos,
    head: [['Machine', 'Type', 'Avg Temp', 'Max Temp', 'Avg Vib', 'Avg Risk', 'Max Risk', 'Health']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      halign: 'center',
    },
    headStyles: {
      fillColor: [26, 35, 50],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
    },
  });

  // ========== RECOMMENDATIONS PAGE ==========
  addNewPage();

  pdf.setFillColor(26, 35, 50);
  pdf.rect(0, 0, pageWidth, 25, 'F');

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Recommendations & Action Items', margin, 17);

  yPos = 40;

  // Generate recommendations based on data
  const recommendations = [];

  if (criticalMachines.length > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      color: [239, 68, 68],
      text: `Immediate attention required for ${criticalMachines.map(m => m.name).join(', ')}. Risk levels exceeded 50%.`,
    });
  }

  if (highTempMachines.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      color: [245, 158, 11],
      text: `Check cooling systems for ${highTempMachines.map(m => m.name).join(', ')}. Temperatures exceeded 60°C.`,
    });
  }

  if (highVibrationMachines.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      color: [59, 130, 246],
      text: `Inspect bearings and alignment for ${highVibrationMachines.map(m => m.name).join(', ')}. Vibration levels elevated.`,
    });
  }

  recommendations.push({
    priority: 'INFO',
    color: [16, 185, 129],
    text: 'Continue regular monitoring schedule. Consider increasing sample frequency during peak operation hours.',
  });

  recommendations.push({
    priority: 'INFO',
    color: [16, 185, 129],
    text: 'Implement predictive maintenance schedule based on risk trend analysis. Schedule maintenance before risk reaches 40%.',
  });

  recommendations.forEach((rec, i) => {
    // Priority badge
    pdf.setFillColor(...rec.color);
    pdf.roundedRect(margin, yPos, 25, 8, 2, 2, 'F');
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(rec.priority, margin + 12.5, yPos + 5.5, { align: 'center' });

    // Recommendation text
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    const recText = pdf.splitTextToSize(rec.text, pageWidth - 2 * margin - 30);
    pdf.text(recText, margin + 30, yPos + 5);

    yPos += recText.length * 5 + 15;
  });

  // ========== CONCLUSION PAGE ==========
  addNewPage();

  pdf.setFillColor(26, 35, 50);
  pdf.rect(0, 0, pageWidth, 25, 'F');

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Conclusion', margin, 17);

  yPos = 40;

  const conclusionText = `This technical report provides a comprehensive analysis of the industrial monitoring session conducted on ${format(new Date(sessionInfo.startTime), 'MMMM dd, yyyy')}. ` +
    `The predictive maintenance system successfully monitored ${machineStats.length} machines, collecting ${recordedData.length} data points over ${Math.round(sessionDuration)} seconds.\n\n` +
    `The AI-powered analytics identified ${criticalMachines.length} critical and ${warningMachines.length} warning-level conditions, enabling proactive maintenance interventions. ` +
    `This approach significantly reduces unplanned downtime and extends equipment lifespan through data-driven decision making.\n\n` +
    `Key achievements of this monitoring session include real-time risk assessment, temperature and vibration trend analysis, and automated alert generation. ` +
    `The system demonstrates the practical application of Industry 4.0 principles and supports sustainable industrial operations.`;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(51, 65, 85);
  const splitConclusion = pdf.splitTextToSize(conclusionText, pageWidth - 2 * margin);
  pdf.text(splitConclusion, margin, yPos);

  yPos += splitConclusion.length * 5 + 20;

  // Signature box
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 35, 50);
  pdf.text('Report Generated By:', margin + 10, yPos + 12);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  pdf.text('CIH Predictive Maintenance System', margin + 10, yPos + 20);
  pdf.text('AI-Powered Industrial Monitoring Platform', margin + 10, yPos + 27);
  pdf.text(`Timestamp: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, pageWidth - margin - 10, yPos + 27, { align: 'right' });

  return pdf;
};

// ============================================
// DATA RECORDER COMPONENT
// ============================================
export default function DataRecorder({ fleetData, isRecording, onRecordingChange }) {
  const [recordedData, setRecordedData] = useState([]);
  const [sessionInfo, setSessionInfo] = useState({ startTime: null, endTime: null });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const startTimeRef = useRef(null);
  const lastRecordTimeRef = useRef(0);

  // Extract machines from fleetData
  const machines = fleetData?.machines || [];

  // Record data when recording is active
  useEffect(() => {
    if (isRecording && machines && machines.length > 0) {
      const now = Date.now();
      // Throttle to every 2 seconds to avoid excessive data
      if (now - lastRecordTimeRef.current >= 2000) {
        lastRecordTimeRef.current = now;
        setRecordedData((prev) => [
          ...prev,
          {
            timestamp: now,
            machines: machines.map((m) => ({
              id: m.id,
              name: m.name,
              type: m.type,
              status: m.status,
              temperature: m.temperature,
              vibration: m.vibration,
              failureRisk: m.failureRisk,
              healthScore: m.healthScore,
              gasLevel: m.gasLevel,
            })),
          },
        ]);
      }
    }
  }, [isRecording, machines]);

  const handleStartRecording = useCallback(() => {
    setRecordedData([]);
    startTimeRef.current = Date.now();
    lastRecordTimeRef.current = 0;
    setSessionInfo({
      startTime: Date.now(),
      endTime: null,
    });
    onRecordingChange(true);
  }, [onRecordingChange]);

  const handleStopRecording = useCallback(() => {
    onRecordingChange(false);
    setSessionInfo((prev) => ({
      ...prev,
      endTime: Date.now(),
    }));
  }, [onRecordingChange]);

  const handleDownloadReport = useCallback(async () => {
    if (recordedData.length === 0) {
      alert('No data recorded. Please record some data first.');
      return;
    }

    setIsGenerating(true);
    try {
      const pdf = await generateReport(recordedData, sessionInfo);
      const fileName = `PredictiveMaintenance_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [recordedData, sessionInfo]);

  const handlePreview = useCallback(() => {
    setPreviewOpen(true);
  }, []);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: 'linear-gradient(135deg, #1a2332 0%, #2d3748 100%)',
        borderRadius: 2,
      }}
    >
      <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
        Data Recording:
      </Typography>

      {!isRecording ? (
        <Button
          variant="contained"
          color="error"
          startIcon={<FiberManualRecordIcon />}
          onClick={handleStartRecording}
          size="small"
          sx={{
            animation: 'none',
            '&:hover': {
              animation: 'pulse 1s infinite',
            },
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
              '70%': { boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
            },
          }}
        >
          Start Recording
        </Button>
      ) : (
        <Button
          variant="contained"
          color="inherit"
          startIcon={<StopIcon />}
          onClick={handleStopRecording}
          size="small"
          sx={{ bgcolor: '#64748b' }}
        >
          Stop Recording
        </Button>
      )}

      {recordedData.length > 0 && (
        <>
          <Chip
            label={`${recordedData.length} samples`}
            size="small"
            sx={{ bgcolor: '#3b82f6', color: 'white' }}
          />

          <Tooltip title="Preview data summary">
            <IconButton
              size="small"
              onClick={handlePreview}
              sx={{ color: '#94a3b8' }}
            >
              <PreviewIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            color="success"
            startIcon={isGenerating ? null : <DownloadIcon />}
            onClick={handleDownloadReport}
            disabled={isGenerating || isRecording}
            size="small"
          >
            {isGenerating ? 'Generating...' : 'Download Report'}
          </Button>
        </>
      )}

      {isRecording && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: '#ef4444',
              animation: 'blink 1s infinite',
              '@keyframes blink': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.3 },
              },
            }}
          />
          <Typography variant="caption" sx={{ color: '#ef4444' }}>
            Recording...
          </Typography>
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1a2332', color: 'white' }}>
          Recording Summary
          <IconButton
            onClick={() => setPreviewOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#94a3b8' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0f172a', color: '#e2e8f0', p: 3 }}>
          {isGenerating && <LinearProgress sx={{ mb: 2 }} />}

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
            <Paper sx={{ p: 2, bgcolor: '#1e293b', textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#3b82f6' }}>
                {recordedData.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Data Samples
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, bgcolor: '#1e293b', textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#10b981' }}>
                {recordedData[0]?.machines?.length || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Machines Monitored
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, bgcolor: '#1e293b', textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#f59e0b' }}>
                {sessionInfo.endTime
                  ? Math.round((sessionInfo.endTime - sessionInfo.startTime) / 1000)
                  : sessionInfo.startTime
                  ? Math.round((Date.now() - sessionInfo.startTime) / 1000)
                  : 0}
                s
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Duration
              </Typography>
            </Paper>
          </Box>

          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
            The generated PDF report will include:
          </Typography>
          <Box component="ul" sx={{ color: '#e2e8f0', pl: 2 }}>
            <li>Executive Summary with key metrics</li>
            <li>Risk trend analysis charts</li>
            <li>Temperature monitoring graphs</li>
            <li>Vibration analysis</li>
            <li>Comparative machine performance</li>
            <li>Health distribution analysis</li>
            <li>Detailed statistics table</li>
            <li>Recommendations & action items</li>
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a2332', p: 2 }}>
          <Button onClick={() => setPreviewOpen(false)} sx={{ color: '#94a3b8' }}>
            Close
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={() => {
              setPreviewOpen(false);
              handleDownloadReport();
            }}
            disabled={isGenerating || recordedData.length === 0}
          >
            Generate & Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
