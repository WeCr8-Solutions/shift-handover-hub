import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;

export function TrigCalculator() {
  const [sideA, setSideA] = useState("");
  const [sideB, setSideB] = useState("");
  const [hyp, setHyp] = useState("");
  const [angleA, setAngleA] = useState("");

  const result = useMemo(() => {
    const a = parseFloat(sideA) || 0;
    const b = parseFloat(sideB) || 0;
    const c = parseFloat(hyp) || 0;
    const alpha = parseFloat(angleA) || 0;
    const given = [a > 0, b > 0, c > 0, alpha > 0].filter(Boolean).length;
    if (given < 2) return null;

    let rA = a, rB = b, rC = c, rAlpha = alpha, rBeta = 0;

    if (a > 0 && b > 0) {
      rC = Math.sqrt(a * a + b * b);
      rAlpha = Math.atan2(a, b) * DEG;
    } else if (a > 0 && c > 0) {
      rB = Math.sqrt(c * c - a * a);
      rAlpha = Math.asin(a / c) * DEG;
    } else if (b > 0 && c > 0) {
      rA = Math.sqrt(c * c - b * b);
      rAlpha = Math.acos(b / c) * DEG;
    } else if (a > 0 && alpha > 0) {
      rB = a / Math.tan(alpha * RAD);
      rC = a / Math.sin(alpha * RAD);
    } else if (b > 0 && alpha > 0) {
      rA = b * Math.tan(alpha * RAD);
      rC = b / Math.cos(alpha * RAD);
    } else if (c > 0 && alpha > 0) {
      rA = c * Math.sin(alpha * RAD);
      rB = c * Math.cos(alpha * RAD);
    }

    rBeta = 90 - rAlpha;
    if (rA <= 0 || rB <= 0 || rC <= 0 || rAlpha <= 0 || rAlpha >= 90) return null;

    return { a: rA, b: rB, c: rC, alpha: rAlpha, beta: rBeta };
  }, [sideA, sideB, hyp, angleA]);

  // SVG triangle
  const svgW = 200, svgH = 160, pad = 20;
  const triPoints = result
    ? (() => {
        const scale = Math.min((svgW - pad * 2) / result.b, (svgH - pad * 2) / result.a);
        const bx = result.b * scale;
        const ay = result.a * scale;
        return `${pad},${svgH - pad} ${pad + bx},${svgH - pad} ${pad},${svgH - pad - ay}`;
      })()
    : null;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Enter any 2 values to solve the right triangle.</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Side A (opposite)</Label>
          <Input value={sideA} onChange={(e) => setSideA(e.target.value)} type="number" step="0.001" placeholder="—" className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Side B (adjacent)</Label>
          <Input value={sideB} onChange={(e) => setSideB(e.target.value)} type="number" step="0.001" placeholder="—" className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Hypotenuse (C)</Label>
          <Input value={hyp} onChange={(e) => setHyp(e.target.value)} type="number" step="0.001" placeholder="—" className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Angle α (degrees)</Label>
          <Input value={angleA} onChange={(e) => setAngleA(e.target.value)} type="number" step="0.1" placeholder="—" className="h-9" />
        </div>
      </div>

      {result && (
        <>
          <Separator />
          <div className="flex gap-4">
            {/* SVG diagram */}
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-40 h-32 shrink-0">
              {triPoints && (
                <>
                  <polygon points={triPoints} fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary))" strokeWidth="2" />
                  {/* Right angle marker */}
                  <rect x={pad} y={svgH - pad - 12} width="12" height="12" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                  {/* Labels */}
                  <text x={pad - 14} y={svgH / 2} fontSize="10" fill="hsl(var(--foreground))" textAnchor="middle" transform={`rotate(-90,${pad - 14},${svgH / 2})`}>A</text>
                  <text x={pad + (result.b * Math.min((svgW - pad * 2) / result.b, (svgH - pad * 2) / result.a)) / 2} y={svgH - pad + 14} fontSize="10" fill="hsl(var(--foreground))" textAnchor="middle">B</text>
                  <text x={pad + (result.b * Math.min((svgW - pad * 2) / result.b, (svgH - pad * 2) / result.a)) / 2 + 10} y={svgH / 2} fontSize="10" fill="hsl(var(--primary))" textAnchor="start">C</text>
                </>
              )}
            </svg>

            {/* Results */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm flex-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Side A:</span>
                <strong>{result.a.toFixed(4)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Angle α:</span>
                <strong>{result.alpha.toFixed(2)}°</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Side B:</span>
                <strong>{result.b.toFixed(4)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Angle β:</span>
                <strong>{result.beta.toFixed(2)}°</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hyp C:</span>
                <strong>{result.c.toFixed(4)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area:</span>
                <strong>{((result.a * result.b) / 2).toFixed(4)}</strong>
              </div>
            </div>
          </div>
        </>
      )}

      {!result && (sideA || sideB || hyp || angleA) && (
        <p className="text-xs text-muted-foreground text-center py-4">Enter at least 2 valid values to solve.</p>
      )}
    </div>
  );
}
