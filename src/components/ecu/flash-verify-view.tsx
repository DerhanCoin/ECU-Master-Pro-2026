'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Shield,
  CheckCircle2,
  XCircle,
  FileCheck,
  ArrowLeftRight,
  Hash,
  RotateCcw,
  FileText,
  Clock,
  AlertTriangle,
  Lock,
  Fingerprint,
  Download,
  RefreshCw,
  Eye,
  ChevronDown,
  Layers,
  Activity,
  Zap,
  CircleDot,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface ChecksumEntry {
  region: string
  ecuChecksum: string
  expectedChecksum: string
  match: boolean
}

const checksumData: ChecksumEntry[] = [
  { region: 'Application Code', ecuChecksum: '0xA7F2C9D1', expectedChecksum: '0xA7F2C9D1', match: true },
  { region: 'Calibration Data', ecuChecksum: '0xB3E8D4F6', expectedChecksum: '0xB3E8D4F6', match: true },
  { region: 'Bootloader', ecuChecksum: '0xC9A1E7B3', expectedChecksum: '0xC9A1E7B3', match: true },
  { region: 'Configuration Data', ecuChecksum: '0xD4F6B2C8', expectedChecksum: '0xD4F6B2C8', match: true },
  { region: 'Safety Parameters', ecuChecksum: '0xE8C3D5A9', expectedChecksum: '0xF1D4E6B2', match: false },
]

interface VerificationBlock {
  id: number
  address: string
  size: string
  status: 'pass' | 'fail' | 'pending' | 'verifying'
}

const initialBlocks: VerificationBlock[] = [
  { id: 1, address: '0x0000_0000', size: '4 KB', status: 'pass' },
  { id: 2, address: '0x0000_1000', size: '4 KB', status: 'pass' },
  { id: 3, address: '0x0000_2000', size: '4 KB', status: 'pass' },
  { id: 4, address: '0x0000_3000', size: '4 KB', status: 'pass' },
  { id: 5, address: '0x0000_4000', size: '4 KB', status: 'pass' },
  { id: 6, address: '0x0000_5000', size: '4 KB', status: 'pass' },
  { id: 7, address: '0x0000_6000', size: '4 KB', status: 'fail' },
  { id: 8, address: '0x0000_7000', size: '4 KB', status: 'pass' },
  { id: 9, address: '0x0000_8000', size: '4 KB', status: 'pass' },
  { id: 10, address: '0x0000_9000', size: '4 KB', status: 'pending' },
  { id: 11, address: '0x0000_A000', size: '4 KB', status: 'pending' },
  { id: 12, address: '0x0000_B000', size: '4 KB', status: 'pending' },
  { id: 13, address: '0x0000_C000', size: '4 KB', status: 'pending' },
  { id: 14, address: '0x0000_D000', size: '4 KB', status: 'pending' },
  { id: 15, address: '0x0000_E000', size: '4 KB', status: 'pending' },
  { id: 16, address: '0x0000_F000', size: '4 KB', status: 'pending' },
]

interface CalibrationDiff {
  parameter: string
  before: string
  after: string
  changed: boolean
  unit: string
}

const calibrationDiffs: CalibrationDiff[] = [
  { parameter: 'Boost Pressure Limit', before: '1.00 bar', after: '1.35 bar', changed: true, unit: 'bar' },
  { parameter: 'Injection Duration (WOT)', before: '3.2 ms', after: '3.8 ms', changed: true, unit: 'ms' },
  { parameter: 'Ignition Timing Base', before: '22° BTDC', after: '26° BTDC', changed: true, unit: '°BTDC' },
  { parameter: 'Rev Limiter', before: '6800 RPM', after: '7200 RPM', changed: true, unit: 'RPM' },
  { parameter: 'Speed Limiter', before: '250 km/h', after: '280 km/h', changed: true, unit: 'km/h' },
  { parameter: 'Throttle Response Map', before: 'Stock', after: 'Sport+', changed: true, unit: '—' },
  { parameter: 'Idle Speed Target', before: '740 RPM', after: '740 RPM', changed: false, unit: 'RPM' },
  { parameter: 'Cold Start Enrichment', before: '1.15x', after: '1.15x', changed: false, unit: 'x' },
  { parameter: 'Coolant Fan On Temp', before: '95°C', after: '92°C', changed: true, unit: '°C' },
  { parameter: 'Oil Temp Warning', before: '135°C', after: '140°C', changed: true, unit: '°C' },
]

const signatureValidation = {
  algorithm: 'RSA-2048 + SHA-256',
  firmwareSignature: '3A7F...B2C8 (512 bytes)',
  publicKey: 'OEM_BOSCH_2026_PUB.pem',
  signatureValid: true,
  certificateChain: 'Valid — Root CA → Intermediate → Signing',
  timestamp: '2026-04-25T14:32:05Z',
  notBefore: '2026-01-01T00:00:00Z',
  notAfter: '2027-12-31T23:59:59Z',
}

const previousVerifications = [
  { date: '2026-04-25 14:35', firmware: 'MED17.5.1 v4.2.3', result: 'pass', blocksChecked: 256, blocksFailed: 0, duration: '1m 42s' },
  { date: '2026-03-15 09:25', firmware: 'MED17.5.1 v4.2.2', result: 'pass', blocksChecked: 256, blocksFailed: 0, duration: '1m 38s' },
  { date: '2026-02-08 16:50', firmware: 'MED17.5.1 v4.1.8', result: 'pass', blocksChecked: 128, blocksFailed: 0, duration: '52s' },
  { date: '2025-12-10 11:30', firmware: 'Bootloader v2.1', result: 'fail', blocksChecked: 32, blocksFailed: 1, duration: '18s' },
  { date: '2025-11-03 09:10', firmware: 'MED17.5.1 v4.0.0', result: 'pass', blocksChecked: 256, blocksFailed: 0, duration: '1m 45s' },
]

export function FlashVerifyView() {
  const [blocks, setBlocks] = useState<VerificationBlock[]>(initialBlocks)
  const [verifying, setVerifying] = useState(false)
  const [autoVerify, setAutoVerify] = useState(true)

  const passedBlocks = blocks.filter(b => b.status === 'pass').length
  const failedBlocks = blocks.filter(b => b.status === 'fail').length
  const totalBlocks = blocks.length
  const verifiedBlocks = blocks.filter(b => b.status !== 'pending').length

  const startVerification = () => {
    setVerifying(true)
    let currentIdx = blocks.findIndex(b => b.status === 'pending')
    if (currentIdx === -1) {
      // Reset and start fresh
      setBlocks(prev => prev.map(b => ({ ...b, status: 'pending' as const })))
      currentIdx = 0
    }

    const interval = setInterval(() => {
      setBlocks(prev => {
        const next = [...prev]
        const pendingIdx = next.findIndex(b => b.status === 'pending' || b.status === 'verifying')
        if (pendingIdx === -1) {
          clearInterval(interval)
          setVerifying(false)
          return next
        }
        // Mark verifying block as complete
        const verifyIdx = next.findIndex(b => b.status === 'verifying')
        if (verifyIdx !== -1) {
          // Block 7 (index 6) fails
          next[verifyIdx] = { ...next[verifyIdx], status: verifyIdx === 6 ? 'fail' : 'pass' }
        }
        // Start next pending block
        const nextPendingIdx = next.findIndex(b => b.status === 'pending')
        if (nextPendingIdx !== -1) {
          next[nextPendingIdx] = { ...next[nextPendingIdx], status: 'verifying' }
        } else {
          clearInterval(interval)
          setVerifying(false)
        }
        return next
      })
    }, 400)
  }

  const allChecksumsMatch = checksumData.every(c => c.match)

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileCheck className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Flash Verification</h1>
            <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">
              VALIDATE
            </Badge>
          </div>
          <p className="text-xs text-[#64748b]">Validate and verify flashed firmware integrity</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#64748b]">Auto-verify</span>
            <Switch checked={autoVerify} onCheckedChange={setAutoVerify} />
          </div>
          <Button size="sm" className="h-8 text-xs bg-[#00d4ff] text-[#0f1923] hover:bg-[#00bcd4] font-semibold gap-1.5" onClick={startVerification} disabled={verifying}>
            <RefreshCw className={`h-3 w-3 ${verifying ? 'animate-spin' : ''}`} />
            {verifying ? 'Verifying...' : 'Start Verification'}
          </Button>
        </div>
      </div>

      {/* Verification Status Dashboard */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#10b981]" />
            Verification Status Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Overall status */}
          <div className={`flex items-center gap-3 p-4 rounded-lg mb-4 ${
            allChecksumsMatch ? 'bg-[#10b981]/10 border border-[#10b981]/30' : 'bg-[#ef4444]/10 border border-[#ef4444]/30'
          }`}>
            {allChecksumsMatch ? (
              <CheckCircle2 className="h-6 w-6 text-[#10b981]" />
            ) : (
              <XCircle className="h-6 w-6 text-[#ef4444]" />
            )}
            <div>
              <div className={`text-sm font-semibold ${allChecksumsMatch ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                {allChecksumsMatch ? 'All Checksums Verified — Firmware Integrity Confirmed' : 'Checksum Mismatch Detected — Verification Failed'}
              </div>
              <p className="text-[10px] text-[#94a3b8]">
                {allChecksumsMatch
                  ? 'All regions match expected values. Firmware is safe to operate.'
                  : 'Safety Parameters region has a checksum mismatch. Do not start engine. Re-flash recommended.'}
              </p>
            </div>
          </div>

          {/* Checksum comparison table */}
          <div className="space-y-2">
            {checksumData.map(cs => (
              <div key={cs.region} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#e2e8f0]">{cs.region}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[9px] text-[#475569]">ECU</div>
                    <div className="text-[11px] font-mono text-[#e2e8f0]">{cs.ecuChecksum}</div>
                  </div>
                  <ArrowLeftRight className="h-3 w-3 text-[#475569]" />
                  <div className="text-right">
                    <div className="text-[9px] text-[#475569]">Expected</div>
                    <div className="text-[11px] font-mono text-[#e2e8f0]">{cs.expectedChecksum}</div>
                  </div>
                  {cs.match ? (
                    <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-[#ef4444]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Block-by-Block Verification */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#00d4ff]" />
              Block-by-Block Verification
            </CardTitle>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-[#10b981]">{passedBlocks} pass</span>
              <span className="text-[#475569]">·</span>
              <span className="text-[#ef4444]">{failedBlocks} fail</span>
              <span className="text-[#475569]">·</span>
              <span className="text-[#64748b]">{verifiedBlocks}/{totalBlocks} checked</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="w-full h-3 bg-[#1e2a3a] rounded-full overflow-hidden mb-4">
            <div className="h-full flex">
              <div className="bg-[#10b981] transition-all duration-300" style={{ width: `${(passedBlocks / totalBlocks) * 100}%` }} />
              <div className="bg-[#ef4444] transition-all duration-300" style={{ width: `${(failedBlocks / totalBlocks) * 100}%` }} />
            </div>
          </div>

          {/* Block grid */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {blocks.map(block => (
              <div
                key={block.id}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition-all cursor-default ${
                  block.status === 'pass'
                    ? 'bg-[#10b981]/15 border-[#10b981]/30'
                    : block.status === 'fail'
                    ? 'bg-[#ef4444]/15 border-[#ef4444]/30'
                    : block.status === 'verifying'
                    ? 'bg-[#00d4ff]/15 border-[#00d4ff]/30 animate-pulse'
                    : 'bg-[#0f1923] border-[#1e2a3a]'
                }`}
                title={`Block ${block.id}: ${block.address} (${block.size}) — ${block.status}`}
              >
                <span className="text-[9px] font-mono text-[#64748b]">{block.id}</span>
                {block.status === 'pass' && <CheckCircle2 className="h-3 w-3 text-[#10b981]" />}
                {block.status === 'fail' && <XCircle className="h-3 w-3 text-[#ef4444]" />}
                {block.status === 'verifying' && <Activity className="h-3 w-3 text-[#00d4ff] animate-spin" />}
                {block.status === 'pending' && <CircleDot className="h-3 w-3 text-[#1e2a3a]" />}
              </div>
            ))}
          </div>

          {/* Failed block detail */}
          {failedBlocks > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-3 w-3 text-[#ef4444]" />
                <span className="text-xs font-semibold text-[#ef4444]">Block 7 Verification Failed</span>
              </div>
              <p className="text-[10px] text-[#94a3b8]">
                Address 0x0000_6000 (4 KB) — Data mismatch at offset +0x024A. Expected 0xFF, read 0x00.
                This may indicate a write error during flash operation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calibration Data Comparison */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-[#8b5cf6]" />
            Calibration Data Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  <th className="text-left py-2 px-3 text-[10px] text-[#475569] font-medium">Parameter</th>
                  <th className="text-left py-2 px-3 text-[10px] text-[#475569] font-medium">Before</th>
                  <th className="text-left py-2 px-3 text-[10px] text-[#475569] font-medium">After</th>
                  <th className="text-center py-2 px-3 text-[10px] text-[#475569] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {calibrationDiffs.map((diff, i) => (
                  <tr key={i} className="border-b border-[#1e2a3a]/50 hover:bg-[#0f1923]/50 transition-colors">
                    <td className="py-2.5 px-3 text-[#e2e8f0] font-medium">{diff.parameter}</td>
                    <td className="py-2.5 px-3 font-mono text-[#64748b]">{diff.before}</td>
                    <td className={`py-2.5 px-3 font-mono ${diff.changed ? 'text-[#f59e0b] font-bold' : 'text-[#64748b]'}`}>
                      {diff.after}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {diff.changed ? (
                        <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[8px]">
                          CHANGED
                        </Badge>
                      ) : (
                        <Badge className="bg-[#475569]/20 text-[#475569] border-[#475569]/30 text-[8px]">
                          SAME
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Firmware Signature Validation */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#10b981]" />
            Firmware Signature Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-3 p-4 rounded-lg mb-4 ${
            signatureValidation.signatureValid
              ? 'bg-[#10b981]/10 border border-[#10b981]/30'
              : 'bg-[#ef4444]/10 border border-[#ef4444]/30'
          }`}>
            {signatureValidation.signatureValid ? (
              <CheckCircle2 className="h-5 w-5 text-[#10b981]" />
            ) : (
              <XCircle className="h-5 w-5 text-[#ef4444]" />
            )}
            <div>
              <div className={`text-sm font-semibold ${signatureValidation.signatureValid ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                {signatureValidation.signatureValid ? 'Signature Valid — Firmware Authenticated' : 'Signature Invalid — Untrusted Firmware'}
              </div>
              <p className="text-[10px] text-[#94a3b8]">
                {signatureValidation.certificateChain}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-1">Algorithm</div>
                <div className="text-xs font-mono font-bold text-[#e2e8f0]">{signatureValidation.algorithm}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-1">Signature</div>
                <div className="text-xs font-mono text-[#e2e8f0]">{signatureValidation.firmwareSignature}</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-1">Public Key</div>
                <div className="text-xs font-mono text-[#e2e8f0]">{signatureValidation.publicKey}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-1">Certificate Validity</div>
                <div className="text-xs font-mono text-[#e2e8f0]">
                  {signatureValidation.notBefore.split('T')[0]} — {signatureValidation.notAfter.split('T')[0]}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rollback Capability */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-[#f59e0b]" />
            Rollback Capability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-1">Previous Firmware</div>
                <div className="text-xs font-mono font-bold text-[#e2e8f0]">MED17.5.1 v4.2.1</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-1">Backup Created</div>
                <div className="text-xs font-mono font-bold text-[#10b981]">2026-04-25 14:30</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="text-[10px] text-[#475569] mb-1">Rollback Status</div>
                <div className="text-xs font-mono font-bold text-[#10b981]">Available</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
              <AlertTriangle className="h-4 w-4 text-[#f59e0b] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-[#f59e0b] mb-1">Rollback Warning</div>
                <p className="text-[11px] text-[#94a3b8]">
                  Rolling back will restore the previous calibration and firmware. Any tune changes made after
                  the backup date will be lost. Ensure the vehicle is in a safe state (ignition on, engine off)
                  before initiating rollback.
                </p>
              </div>
            </div>
            <Button size="sm" className="h-9 text-xs bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/30 gap-1.5 w-full md:w-auto">
              <RotateCcw className="h-3 w-3" />
              Initiate Rollback to v4.2.1
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Report */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/15 flex items-center justify-center shrink-0">
              <Download className="h-5 w-5 text-[#00d4ff]" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#e2e8f0] mb-1">Generate Verification Report</div>
              <p className="text-[10px] text-[#475569]">Download a detailed PDF report with all verification data</p>
            </div>
            <Button size="sm" className="h-8 text-xs bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 hover:bg-[#00d4ff]/30 gap-1">
              <FileText className="h-3 w-3" />
              Export
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/15 flex items-center justify-center shrink-0">
              <Eye className="h-5 w-5 text-[#8b5cf6]" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#e2e8f0] mb-1">Deep Verification</div>
              <p className="text-[10px] text-[#475569]">Perform byte-level comparison of all flash regions</p>
            </div>
            <Button size="sm" className="h-8 text-xs bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/30 gap-1">
              <Fingerprint className="h-3 w-3" />
              Deep Scan
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Previous Verification Results */}
      <Card className="bg-[#151d2b] border-[#1e2a3a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#f59e0b]" />
            Previous Verification Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {previousVerifications.map((pv, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1923] border border-[#1e2a3a]">
                <div className="flex items-center gap-3">
                  {pv.result === 'pass' ? (
                    <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-[#ef4444]" />
                  )}
                  <div>
                    <div className="text-xs font-medium text-[#e2e8f0]">{pv.firmware}</div>
                    <div className="text-[10px] text-[#475569]">{pv.date} · {pv.blocksChecked} blocks · {pv.duration}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pv.blocksFailed > 0 && (
                    <span className="text-[10px] text-[#ef4444] font-mono">{pv.blocksFailed} failed</span>
                  )}
                  <Badge className={`text-[9px] ${
                    pv.result === 'pass'
                      ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
                      : 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'
                  }`}>
                    {pv.result.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
