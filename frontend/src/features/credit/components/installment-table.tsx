import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "react-toastify";

import type { Installment } from "@/features/credit/types";
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
      onSuccess: () => toast.success(`Installment #${target.sequence} marked paid`),
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
            <TH>Due date</TH>
            <TH align="right">Amount</TH>
            <TH>Status</TH>
            <TH>Paid on</TH>
            <TH align="right">Action</TH>
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
                <Badge value={i.status} />
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
                      <Check className="h-3.5 w-3.5" /> Mark paid
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
        title="Mark installment paid?"
        description={
          target
            ? `Installment #${target.sequence} · ${formatIDR(target.amount)} due ${formatDate(target.due_date)}.`
            : ""
        }
        confirmLabel="Mark paid"
        loading={pay.isPending}
        onConfirm={confirmPay}
      />
    </>
  );
}
