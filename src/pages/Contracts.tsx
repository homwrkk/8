import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Calendar, DollarSign, CheckCircle, Clock, AlertCircle, ChevronRight, Plus } from 'lucide-react';

interface Contract {
  id: string;
  tender_id: string;
  contractor_id: string;
  client_name: string;
  total_amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'on_hold';
  zoho_project_id: string;
  created_at: string;
}

interface Milestone {
  id: string;
  contract_id: string;
  milestone_name: string;
  percentage: number;
  amount_ugx: number;
  status: 'pending' | 'verified' | 'paid';
  due_date: string;
  zoho_invoice_id: string;
}

export default function Contracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'completed' | 'on_hold' | 'all'>('active');

  useEffect(() => {
    fetchContracts();
  }, [user?.id]);

  useEffect(() => {
    if (selectedContract) {
      fetchMilestones(selectedContract.id);
    }
  }, [selectedContract]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('contractor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
      if (data && data.length > 0) {
        setSelectedContract(data[0]);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMilestones = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('contract_milestones')
        .select('*')
        .eq('contract_id', contractId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  };

  const getFilteredContracts = () => {
    if (filter === 'all') return contracts;
    return contracts.filter((c) => c.status === filter);
  };

  const formatCurrency = (amount: number, currency: string = 'UGX') => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getMilestoneProgress = () => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter((m) => m.status === 'paid').length;
    return (completed / milestones.length) * 100;
  };

  const getTotalMilestoneAmount = () => {
    return milestones.reduce((sum, m) => sum + m.amount_ugx, 0);
  };

  const getMilestonePaidAmount = () => {
    return milestones
      .filter((m) => m.status === 'paid')
      .reduce((sum, m) => sum + m.amount_ugx, 0);
  };

  const filteredContracts = getFilteredContracts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">My Contracts</h1>
              <p className="text-slate-600">
                Manage your active contracts, milestones, and payments
              </p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg flex items-center transition-colors">
              <Plus size={20} className="mr-2" />
              New Contract
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8">
          {(['active', 'completed', 'on_hold', 'all'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {status === 'on_hold' ? 'On Hold' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contracts List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">
                  Contracts ({filteredContracts.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : filteredContracts.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    No contracts found
                  </div>
                ) : (
                  filteredContracts.map((contract) => (
                    <button
                      key={contract.id}
                      onClick={() => setSelectedContract(contract)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors border-l-4 ${
                        selectedContract?.id === contract.id
                          ? 'border-l-blue-600 bg-blue-50'
                          : 'border-l-slate-200'
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{contract.client_name}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {formatCurrency(contract.total_amount, contract.currency)}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${getStatusColor(contract.status)}`}>
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Contract Details and Milestones */}
          <div className="lg:col-span-2">
            {selectedContract ? (
              <div className="space-y-6">
                {/* Contract Header */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedContract.client_name}</h2>
                      <p className="text-slate-600 mt-1">Contract ID: {selectedContract.id}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-lg font-medium ${getStatusColor(selectedContract.status)}`}>
                      {selectedContract.status.charAt(0).toUpperCase() + selectedContract.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Total Contract Value</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(selectedContract.total_amount, selectedContract.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Contract Duration</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {new Date(selectedContract.start_date).toLocaleDateString()} to{' '}
                        {new Date(selectedContract.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Milestones Progress */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Milestones & Payments</h3>

                  {milestones.length === 0 ? (
                    <p className="text-slate-600">No milestones created yet</p>
                  ) : (
                    <>
                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-700">Overall Progress</p>
                          <p className="text-sm font-bold text-blue-600">{Math.round(getMilestoneProgress())}%</p>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all"
                            style={{ width: `${getMilestoneProgress()}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Paid</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(getMilestonePaidAmount())}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Total Milestones</p>
                          <p className="text-lg font-bold text-slate-900">
                            {formatCurrency(getTotalMilestoneAmount())}
                          </p>
                        </div>
                      </div>

                      {/* Milestones List */}
                      <div className="space-y-3">
                        {milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {milestone.status === 'paid' ? (
                                  <CheckCircle className="text-green-600" size={20} />
                                ) : milestone.status === 'verified' ? (
                                  <Clock className="text-blue-600" size={20} />
                                ) : (
                                  <AlertCircle className="text-yellow-600" size={20} />
                                )}
                                <p className="font-semibold text-slate-900">{milestone.milestone_name}</p>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                                  {milestone.percentage}%
                                </span>
                                <span className="flex items-center">
                                  <Calendar size={14} className="mr-1" />
                                  Due: {new Date(milestone.due_date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-slate-900">
                                {formatCurrency(milestone.amount_ugx)}
                              </p>
                              <p className={`text-xs font-medium mt-1 ${
                                milestone.status === 'paid'
                                  ? 'text-green-600'
                                  : milestone.status === 'verified'
                                  ? 'text-blue-600'
                                  : 'text-yellow-600'
                              }`}>
                                {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors">
                        Upload Proof of Work
                        <ChevronRight size={16} className="ml-2" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-slate-600 text-lg">Select a contract to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
