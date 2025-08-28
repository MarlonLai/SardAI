import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { formatPrice, formatDate } from '@/utils/formatters';
import { 
  Download, 
  FileText, 
  Calendar, 
  DollarSign, 
  RefreshCw,
  Receipt,
  ExternalLink
} from 'lucide-react';

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { subscription } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Get user's Stripe customer ID
      const { data: customer, error: customerError } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .single();

      if (customerError || !customer) {
        throw new Error('No customer data found');
      }

      // In a real implementation, you would call a Supabase Edge Function 
      // that retrieves invoices from Stripe API
      const { data, error } = await supabase.functions.invoke('stripe-invoices', {
        body: { customer_id: customer.customer_id }
      });

      if (error) {
        // For now, show mock data if the function doesn't exist yet
        setInvoices(getMockInvoices());
        return;
      }

      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // Show mock data for development
      setInvoices(getMockInvoices());
    } finally {
      setLoading(false);
    }
  };

  const getMockInvoices = () => [
    {
      id: 'inv_mock_1',
      number: 'SARDAI-001',
      amount_paid: 500, // €5.00 in cents
      currency: 'eur',
      status: 'paid',
      created: Math.floor(Date.now() / 1000) - 86400, // Yesterday
      invoice_pdf: '#',
      period_start: Math.floor(Date.now() / 1000) - 2592000, // 30 days ago
      period_end: Math.floor(Date.now() / 1000), // Now
    },
    {
      id: 'inv_mock_2', 
      number: 'SARDAI-002',
      amount_paid: 5000, // €50.00 in cents
      currency: 'chf',
      status: 'paid',
      created: Math.floor(Date.now() / 1000) - 2592000, // 30 days ago
      invoice_pdf: '#',
      period_start: Math.floor(Date.now() / 1000) - 31536000, // 1 year ago
      period_end: Math.floor(Date.now() / 1000) - 2592000, // 30 days ago
    }
  ];

  const handleDownloadInvoice = async (invoiceId, invoiceUrl) => {
    try {
      if (invoiceUrl === '#') {
        toast({
          title: "Anteprima Fattura",
          description: "Questa è una fattura di esempio. Le fatture reali saranno disponibili a breve.",
        });
        return;
      }

      // Open invoice in new tab
      window.open(invoiceUrl, '_blank');
      
      toast({
        title: "Fattura Scaricata",
        description: "La fattura è stata aperta in una nuova finestra.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile scaricare la fattura.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'bg-green-500/20 text-green-400', label: 'Pagata' },
      open: { color: 'bg-yellow-500/20 text-yellow-400', label: 'In Attesa' },
      draft: { color: 'bg-gray-500/20 text-gray-400', label: 'Bozza' },
      void: { color: 'bg-red-500/20 text-red-400', label: 'Annullata' }
    };

    const config = statusConfig[status] || statusConfig.paid;
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Receipt className="w-5 h-5 mr-2" />
          Fatture e Pagamenti
        </h3>
        <Button
          onClick={fetchInvoices}
          variant="outline"
          size="sm"
          disabled={loading}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="sardinian-card animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <Card className="sardinian-card">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">Nessuna fattura disponibile</p>
            <p className="text-gray-400 text-sm mt-2">
              Le tue fatture appariranno qui dopo i primi pagamenti
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="sardinian-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-white font-semibold">
                        Fattura #{invoice.number}
                      </h4>
                      {getStatusBadge(invoice.status)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>
                          {formatPrice(invoice.amount_paid / 100, invoice.currency)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(new Date(invoice.created * 1000))}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm">
                      Periodo: {formatDate(new Date(invoice.period_start * 1000), { month: 'short', day: 'numeric' })} - {formatDate(new Date(invoice.period_end * 1000), { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_pdf)}
                    variant="outline"
                    size="sm"
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    aria-label={`Scarica fattura ${invoice.number}`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Scarica PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}