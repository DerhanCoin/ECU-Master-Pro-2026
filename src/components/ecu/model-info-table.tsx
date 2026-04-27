'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function ModelInfoTable() {
  const models = [
    {
      model: 'Transformer-XL Ensemble',
      accuracy: '94.2%',
      accuracyColor: '#10b981',
      trainingData: '2.4M vehicles',
      architecture: 'Edge-FL Hybrid',
      digitalTwin: 'Active',
      lastUpdated: 'Apr 8, 2026',
    },
    {
      model: 'LSTM Attention Net',
      accuracy: '91.7%',
      accuracyColor: '#10b981',
      trainingData: '1.8M vehicles',
      architecture: 'Cloud-Only',
      digitalTwin: 'Inactive',
      lastUpdated: 'Mar 22, 2026',
    },
    {
      model: 'GNN Fault Propagation',
      accuracy: '89.3%',
      accuracyColor: '#f59e0b',
      trainingData: '1.2M vehicles',
      architecture: 'Edge-FL Hybrid',
      digitalTwin: 'Active',
      lastUpdated: 'Feb 15, 2026',
    },
  ]

  return (
    <div className="bg-[#151d2b] border border-[#1e2a3a] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e2a3a] flex items-center gap-2">
        <div className="w-1.5 h-5 bg-[#8b5cf6] rounded-full" />
        <h3 className="text-sm font-semibold text-[#e2e8f0]">AI Model Information 2026</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[#1e2a3a] hover:bg-transparent">
            <TableHead className="text-[10px] font-bold text-[#475569] uppercase tracking-wider">Model</TableHead>
            <TableHead className="text-[10px] font-bold text-[#475569] uppercase tracking-wider">Accuracy</TableHead>
            <TableHead className="text-[10px] font-bold text-[#475569] uppercase tracking-wider">Training Data</TableHead>
            <TableHead className="text-[10px] font-bold text-[#475569] uppercase tracking-wider">Architecture</TableHead>
            <TableHead className="text-[10px] font-bold text-[#475569] uppercase tracking-wider">Digital Twin</TableHead>
            <TableHead className="text-[10px] font-bold text-[#475569] uppercase tracking-wider">Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((m, i) => (
            <TableRow key={i} className="border-b border-[#1e2a3a] hover:bg-[#1e2a3a]/30">
              <TableCell className="text-xs font-medium text-[#e2e8f0]">{m.model}</TableCell>
              <TableCell className="text-xs font-bold" style={{ color: m.accuracyColor }}>
                {m.accuracy}
              </TableCell>
              <TableCell className="text-xs text-[#94a3b8]">{m.trainingData}</TableCell>
              <TableCell className="text-xs">
                <span className="text-[#00d4ff] cursor-pointer hover:underline">{m.architecture}</span>
              </TableCell>
              <TableCell className="text-xs">
                <Badge
                  className={`text-[10px] px-1.5 py-0 h-4 ${
                    m.digitalTwin === 'Active'
                      ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                      : 'bg-[#475569]/20 text-[#475569] border-[#475569]/30'
                  }`}
                >
                  {m.digitalTwin}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-[#94a3b8]">{m.lastUpdated}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
