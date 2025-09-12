import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, UserCheck, Edit, Save, X, MessageSquare, Clipboard, ClipboardCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { formatDateToBR } from '@/lib/utils';
import { 
  getAfterSalesAlerts, 
  markAsContacted15Days, 
  markAsContacted45Days,
  getAllContacts,
  getContactsNeeding15Day,
  getContactsNeeding45Day,
  getFullyContactedCustomers
} from '@/services/afterSalesService';

const AfterSalesView = ({ orders = [] }) => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [editedCampaign, setEditedCampaign] = useState(null);
  const [copiedScriptId, setCopiedScriptId] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Contact Manager States
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', '15day', '45day', 'completed'
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState(null);

  useEffect(() => {
    // Load campaigns from localStorage
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

    // Load after-sales alerts
    loadAfterSalesAlerts();
    
    // Load all contacts initially
    loadContacts('all');
  }, []);

  const loadAfterSalesAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const alertsData = await getAfterSalesAlerts();
      setAlerts(alertsData);
    } catch (err) {
      console.error('Error loading after-sales alerts:', err);
      setError('Erro ao carregar alertas de pós-venda');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async (filterType = 'all') => {
    try {
      setContactsLoading(true);
      setContactsError(null);
      
      let contactsData = [];
      
      switch (filterType) {
        case '15day':
          contactsData = await getContactsNeeding15Day();
          break;
        case '45day':
          contactsData = await getContactsNeeding45Day();
          break;
        case 'completed':
          contactsData = await getFullyContactedCustomers();
          break;
        default:
          contactsData = await getAllContacts();
      }
      
      setContacts(contactsData);
      setActiveFilter(filterType);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setContactsError('Erro ao carregar contatos');
    } finally {
      setContactsLoading(false);
    }
  };

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

  const handleContact = async (contact, contactType = '15day') => {
    try {
      if (contactType === '15day') {
        await markAsContacted15Days(contact.pedido_id);
      } else if (contactType === '45day') {
        await markAsContacted45Days(contact.pedido_id);
      }
      
      // Refresh the contacts list
      await loadContacts(activeFilter);
      
      toast({
        title: '✅ Contato Registrado',
        description: `Pós-venda com ${contact.customer} marcado como concluído para ${contactType === '15day' ? '15' : '45'} dias.`,
      });
    } catch (error) {
      console.error('Error marking as contacted:', error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível marcar como contatado. Tente novamente."
      });
    }
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

        {/* Contact Manager */}
        <div className="glass-effect rounded-xl p-6 h-full">
          <h2 className="text-2xl font-bold text-white flex items-center mb-6">
            <Bell className="w-6 h-6 mr-2 text-cyan-400" />
            Gerenciador de Contatos
          </h2>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadContacts('all')}
              className={`text-xs transition-colors ${
                activeFilter === 'all' 
                  ? 'bg-black text-white border-black hover:bg-purple-500' 
                  : 'bg-white text-black border-gray-300 hover:bg-gray-50'
              }`}
            >
              Todos ({contacts.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadContacts('15day')}
              className={`text-xs transition-colors ${
                activeFilter === '15day' 
                  ? 'bg-black text-white border-black hover:bg-purple-500' 
                  : 'bg-white text-black border-gray-300 hover:bg-gray-50'
              }`}
            >
              15 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadContacts('45day')}
              className={`text-xs transition-colors ${
                activeFilter === '45day' 
                  ? 'bg-black text-white border-black hover:bg-purple-500' 
                  : 'bg-white text-black border-gray-300 hover:bg-gray-50'
              }`}
            >
              45 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadContacts('completed')}
              className={`text-xs transition-colors ${
                activeFilter === 'completed' 
                  ? 'bg-black text-white border-black hover:bg-purple-500' 
                  : 'bg-white text-black border-gray-300 hover:bg-gray-50'
              }`}
            >
              Contatados
            </Button>
          </div>

          {/* Contacts List */}
          {contactsLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <Loader2 className="w-8 h-8 mb-4 animate-spin" />
              <p className="font-semibold">Carregando contatos...</p>
            </div>
          ) : contactsError ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-red-400">
              <Bell className="w-12 h-12 mb-4" />
              <p className="font-semibold">Erro ao carregar contatos</p>
              <p className="text-sm">{contactsError}</p>
              <button 
                onClick={() => loadContacts(activeFilter)}
                className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-sm"
              >
                Tentar novamente
              </button>
            </div>
          ) : contacts.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {contacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${
                    contact.envio_15 && contact.envio_45 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-cyan-500/10 border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white">{contact.customer}</p>
                      <p className="text-xs text-gray-300">Pedido: {contact.pedido_id}</p>
                      <p className="text-xs text-gray-400">Data prevista: {formatDateToBR(contact.promisedDate)}</p>
                      <div className="flex gap-4 mt-1">
                        <span className={`text-xs ${contact.envio_15 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {contact.envio_15 ? '✓ 15 dias' : '⏳ 15 dias'}
                        </span>
                        <span className={`text-xs ${contact.envio_45 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {contact.envio_45 ? '✓ 45 dias' : '⏳ 45 dias'}
                        </span>
                      </div>
                    </div>
                    <div className="text-center mr-4">
                      <p className="text-sm font-semibold text-cyan-300">
                        {contact.daysSinceAfterSales} dias
                      </p>
                      <p className="text-xs text-gray-400">pós-venda</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyScript(campaigns[0]?.script.replace('[cliente]', contact.customer) || '')}
                        title="Copiar script"
                      >
                        {copiedScriptId === campaigns[0]?.script ? <ClipboardCheck className="w-5 h-5 text-green-400" /> : <Clipboard className="w-5 h-5 text-cyan-300" />}
                      </Button>
                      {!contact.envio_15 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleContact(contact, '15day')}
                          title="Marcar 15 dias como contatado"
                        >
                          <UserCheck className="w-5 h-5 text-green-400" />
                        </Button>
                      )}
                      {!contact.envio_45 && contact.envio_15 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleContact(contact, '45day')}
                          title="Marcar 45 dias como contatado"
                        >
                          <UserCheck className="w-5 h-5 text-blue-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <Bell className="w-12 h-12 mb-4" />
              <p className="font-semibold">
                {activeFilter === 'all' 
                  ? 'Nenhum contato elegível para pós-venda no momento.' 
                  : `Nenhum contato encontrado para o filtro selecionado.`
                }
              </p>
              <p className="text-sm">
                {activeFilter === 'all' 
                  ? 'Aguardando data_prevista + 15 dias...' 
                  : 'Tente outro filtro ou aguarde novos dados.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AfterSalesView;