import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bell, UserCheck, Edit, Save, X, MessageSquare, Clipboard, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { differenceInDays } from 'date-fns';

const AfterSalesView = ({ orders }) => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [editedCampaign, setEditedCampaign] = useState(null);
  const [copiedScriptId, setCopiedScriptId] = useState(null);

  useEffect(() => {
    const savedCampaigns = localStorage.getItem('afterSalesCampaigns');
    if (savedCampaigns) {
      setCampaigns(JSON.parse(savedCampaigns));
    } else {
      // Campanhas padrão baseadas em boas práticas de pós-venda
      const defaultCampaigns = [
        { 
          id: 1, 
          name: 'Contato 15 dias', 
          days: 15, 
          script: 'Olá [cliente]! Tudo bem? Passando para saber se está tudo certo com o seu pedido e se precisa de algo. 😊', 
          feedback: '' 
        },
        { 
          id: 2, 
          name: 'Contato 45 dias', 
          days: 45, 
          script: 'Oi [cliente]! Como vai? Só para lembrar que estamos aqui se precisar de novos quadros ou qualquer outra coisa. Abraços!', 
          feedback: '' 
        },
      ];
      setCampaigns(defaultCampaigns);
    }
  }, []);

  const handleEdit = (campaign) => {
    setEditingCampaignId(campaign.id);
    setEditedCampaign({ ...campaign });
  };

  const handleSave = () => {
    const updatedCampaigns = campaigns.map(c => c.id === editingCampaignId ? editedCampaign : c);
    setCampaigns(updatedCampaigns);
    localStorage.setItem('afterSalesCampaigns', JSON.stringify(updatedCampaigns));
    setEditingCampaignId(null);
    setEditedCampaign(null);
    toast({
      title: '✅ Campanha Salva!',
      description: 'As configurações da campanha de pós-venda foram atualizadas.',
    });
  };

  const handleCancel = () => {
    setEditingCampaignId(null);
    setEditedCampaign(null);
  };

  const handleInputChange = (e, field) => {
    setEditedCampaign({ ...editedCampaign, [field]: e.target.value });
  };

  const handleContact = (customerName, campaignId) => {
    toast({
      title: '✅ Contato Registrado',
      description: `Pós-venda com ${customerName} para a campanha "${campaigns.find(c => c.id === campaignId).name}" marcado como concluído.`,
    });
  };

  const copyScript = (script) => {
    navigator.clipboard.writeText(script);
    setCopiedScriptId(script);
    setTimeout(() => setCopiedScriptId(null), 2000);
    toast({
      title: '📋 Script Copiado!',
      description: 'O texto da abordagem foi copiado para a área de transferência.',
    });
  };

  const alerts = useMemo(() => {
    const now = new Date();
    const deliveredOrders = orders.filter(o => o.deliveryDate);
    let allAlerts = [];

    campaigns.forEach(campaign => {
      const alertsForCampaign = deliveredOrders
        .filter(o => {
          const daysSinceDelivery = differenceInDays(now, new Date(o.deliveryDate));
          return daysSinceDelivery >= campaign.days;
        })
        .map(o => ({ ...o, campaignId: campaign.id, campaignName: campaign.name, campaignDays: campaign.days }));
      allAlerts = [...allAlerts, ...alertsForCampaign];
    });
    
    return allAlerts.sort((a, b) => parseInt(a.id) - parseInt(b.id)); // Ordenar por ID do pedido (ascendente)
  }, [orders, campaigns]);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Settings */}
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Edit className="w-6 h-6 mr-2 text-cyan-400" />
            Configurar Campanhas de Pós-venda
          </h2>
          <div className="space-y-4">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="bg-black/20 p-4 rounded-lg border border-white/10">
                {editingCampaignId === campaign.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editedCampaign.name}
                      onChange={(e) => handleInputChange(e, 'name')}
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <Input
                      type="number"
                      value={editedCampaign.days}
                      onChange={(e) => handleInputChange(e, 'days')}
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <Textarea
                      value={editedCampaign.script}
                      onChange={(e) => handleInputChange(e, 'script')}
                      className="bg-white/10 border-white/20 text-white"
                      rows={3}
                    />
                    <Textarea
                      placeholder="Observações e feedback do cliente..."
                      value={editedCampaign.feedback}
                      onChange={(e) => handleInputChange(e, 'feedback')}
                      className="bg-white/10 border-white/20 text-white"
                      rows={2}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button size="sm" variant="ghost" onClick={handleCancel}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
                      <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{campaign.name} ({campaign.days} dias)</h3>
                        <p className="text-sm text-gray-400 mt-2 flex items-start">
                          <MessageSquare className="w-4 h-4 mr-2 mt-1 shrink-0" />
                          <span className="italic">"{campaign.script}"</span>
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(campaign)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div className="glass-effect rounded-xl p-6 h-full">
          <h2 className="text-2xl font-bold text-white flex items-center mb-6">
            <Bell className="w-6 h-6 mr-2 text-cyan-400" />
            Alertas de Pós-venda
          </h2>
          {alerts.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {alerts.map((alert, index) => (
                <motion.div
                  key={`${alert.id}-${alert.campaignId}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-3 rounded-lg border bg-cyan-500/10 border-cyan-500/30"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{alert.customer}</p>
                      <p className="text-xs text-gray-300">Pedido: {alert.order_id}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-cyan-300">{alert.campaignName}</p>
                      <p className="text-xs text-gray-400">{differenceInDays(new Date(), new Date(alert.deliveryDate))} dias pós-entrega</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyScript(campaigns.find(c => c.id === alert.campaignId).script.replace('[cliente]', alert.customer))}
                        title="Copiar script"
                      >
                        {copiedScriptId === campaigns.find(c => c.id === alert.campaignId).script ? <ClipboardCheck className="w-5 h-5 text-green-400" /> : <Clipboard className="w-5 h-5 text-cyan-300" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleContact(alert.customer, alert.campaignId)}
                        title="Marcar como contatado"
                      >
                        <UserCheck className="w-5 h-5 text-green-400" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <Bell className="w-12 h-12 mb-4" />
              <p className="font-semibold">Nenhum alerta de pós-venda no momento.</p>
              <p className="text-sm">Tudo em dia!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AfterSalesView;