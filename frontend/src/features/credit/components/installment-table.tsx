import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "react-toastify";

import type { Installment } from "@/features/credit/types";
import { INSTALLMENT_STATUS_LABELS } from "@/features/credit/types";
import { useMarkInstallmentPaid } from "@/features/credit/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NumCell, TBody, TD, TH, THead, Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate, formatIDR } from "@/lib/format";

export function InstallmentTable({ installments }: { installments: Installment[] }) {
  const pay = useMarkInstallmentPaid();
  const [target, setTarget] = useState<Installment | null>(null);

  function confirmPay() {
    if (!target) return;
    pay.mutate(target.id, {
      onSuccess: () => toast.success(`Cicilan #${target.sequence} ditandai lunas`),
      onError: (e) => toast.error(e.message),
    });
    setTarget(null);
  }

  return (
    <>
      <Table>
        <THead>
          <tr>
            <TH>#</TH>
            <TH>Jatuh tempo</TH>
            <TH align="right">Jumlah</TH>
            <TH>Status</TH>
            <TH>Dibayar pada</TH>
            <TH align="right">Aksi</TH>
          </tr>
        </THead>
        <TBody>
          {installments.map((i) => (
            <tr
              key={i.id}
              className={cn(
                "transition-colors hover:bg-surface-muted/50",
                i.status === "overdue" && "bg-negative/5",
              )}
            >
              <TD className="text-muted-foreground">{i.sequence}</TD>
              <TD className={cn(i.status === "overdue" ? "font-medium text-negative" : "text-muted-foreground")}>
                {formatDate(i.due_date)}
              </TD>
              <NumCell>{formatIDR(i.amount)}</NumCell>
              <TD>
                <Badge value={i.status} label={INSTALLMENT_STATUS_LABELS[i.status]} />
              </TD>
              <TD className="text-muted-foreground">{formatDate(i.paid_on)}</TD>
              <TD>
                <div className="flex justify-end">
                  {i.status !== "paid" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setTarget(i)}
                      className="text-positive"
                    >
                      <Check className="h-3.5 w-3.5" /> Tandai lunas
                    </Button>
                  )}
                </div>
              </TD>
            </tr>
          ))}
        </TBody>
      </Table>

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title="Tandai cicilan lunas?"
        description={
          target
            ? `Cicilan #${target.sequence} · ${formatIDR(target.amount)} jatuh tempo ${formatDate(target.due_date)}.`
            : ""
        }
        confirmLabel="Tandai lunas"
        loading={pay.isPending}
        onConfirm={confirmPay}
      />
    </>
  );
}
