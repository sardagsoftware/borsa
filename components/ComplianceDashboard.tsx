import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  User, Shield, FileText, Clock, CheckCircle, 
  AlertTriangle, XCircle, Plus, Download, Upload, 
  Eye, Edit3, Trash2, X 
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  country: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  amlRiskScore: number;
  joinDate: string;
  lastActivity: string;
  totalVolume: number;
  documents: Array<{
    id: string;
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadDate: string;
  }>;
}

interface ComplianceAlert {
  id: string;
  type: 'kyc_expiry' | 'high_risk_transaction' | 'suspicious_activity' | 'document_required';
  customer: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  status: 'active' | 'resolved' | 'dismissed';
}

const ComplianceDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    // Mock data
    setCustomers([
      {
        id: '1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        country: 'United States',
        kycStatus: 'approved',
        amlRiskScore: 15,
        joinDate: '2024-01-15',
        lastActivity: '2024-01-20',
        totalVolume: 125000,
        documents: [
          { id: '1', type: 'passport', status: 'approved', uploadDate: '2024-01-15' },
          { id: '2', type: 'proof_of_address', status: 'approved', uploadDate: '2024-01-15' }
        ]
      },
      {
        id: '2',
        name: 'Bob Smith',
        email: 'bob@example.com',
        country: 'Canada',
        kycStatus: 'pending',
        amlRiskScore: 85,
        joinDate: '2024-01-18',
        lastActivity: '2024-01-19',
        totalVolume: 25000,
        documents: [
          { id: '3', type: 'drivers_license', status: 'pending', uploadDate: '2024-01-18' }
        ]
      }
    ]);

    setAlerts([
      {
        id: '1',
        type: 'high_risk_transaction',
        customer: 'Bob Smith',
        message: 'Large transaction flagged for review ($50,000)',
        severity: 'high',
        timestamp: '2024-01-20T10:30:00Z',
        status: 'active'
      },
      {
        id: '2',
        type: 'kyc_expiry',
        customer: 'Charlie Brown',
        message: 'KYC documentation expires in 7 days',
        severity: 'medium',
        timestamp: '2024-01-20T09:15:00Z',
        status: 'active'
      }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'expired': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return { label: 'Low', color: 'text-green-600' };
    if (score < 70) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'High', color: 'text-red-600' };
  };

  const ComplianceOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">KYC Approved</p>
                <p className="text-2xl font-bold text-green-600">1,198</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">32</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-red-600">17</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Compliance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    alert.severity === 'high' ? 'bg-red-100 text-red-600' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{alert.customer}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">Review</Button>
                  <Button variant="ghost" size="sm">Dismiss</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const KYCManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">KYC Management</h3>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New KYC Review
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Risk Score</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Documents</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Last Activity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const riskLevel = getRiskLevel(customer.amlRiskScore);
                  return (
                    <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                          <p className="text-xs text-gray-500">{customer.country}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.kycStatus)}`}>
                          {getStatusIcon(customer.kycStatus)}
                          {customer.kycStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-medium ${riskLevel.color}`}>
                              {customer.amlRiskScore}/100
                            </span>
                            <span className={`text-xs ${riskLevel.color}`}>
                              ({riskLevel.label})
                            </span>
                          </div>
                          <Progress value={customer.amlRiskScore} className="h-2" />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {customer.documents.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-2 text-xs">
                              <span className={`w-2 h-2 rounded-full ${
                                doc.status === 'approved' ? 'bg-green-500' :
                                doc.status === 'pending' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}></span>
                              <span>{doc.type.replace('_', ' ')}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(customer.lastActivity).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(customer)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AMLMonitoring = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AML Monitoring</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Investigation
          </Button>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Low Risk Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">856</span>
              <div className="text-sm text-gray-500">68.7%</div>
            </div>
            <Progress value={68.7} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Medium Risk Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-yellow-600">328</span>
              <div className="text-sm text-gray-500">26.3%</div>
            </div>
            <Progress value={26.3} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">High Risk Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-red-600">63</span>
              <div className="text-sm text-gray-500">5.0%</div>
            </div>
            <Progress value={5.0} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Suspicious Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Suspicious Activity Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">Unusual Transaction Pattern Detected</p>
                    <p className="text-sm text-red-700">Customer: Bob Smith - Multiple large deposits in short timeframe</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Investigate</Button>
              </div>
            </div>

            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900">Geographic Risk Alert</p>
                    <p className="text-sm text-yellow-700">Customer: Alice Johnson - Transaction from high-risk jurisdiction</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Review</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const DocumentManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Document Management</h3>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Document Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Passport - Bob Smith</p>
                    <p className="text-sm text-gray-600">Uploaded 2 days ago</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-green-600 border-green-200">
                    Approve
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                    Reject
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Utility Bill - Charlie Brown</p>
                    <p className="text-sm text-gray-600">Uploaded 1 day ago</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-green-600 border-green-200">
                    Approve
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Passports</span>
                  <span>847 documents</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Driver's Licenses</span>
                  <span>523 documents</span>
                </div>
                <Progress value={52} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Proof of Address</span>
                  <span>1,198 documents</span>
                </div>
                <Progress value={96} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Bank Statements</span>
                  <span>672 documents</span>
                </div>
                <Progress value={54} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kyc">KYC Management</TabsTrigger>
          <TabsTrigger value="aml">AML Monitoring</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ComplianceOverview />
        </TabsContent>

        <TabsContent value="kyc" className="space-y-6">
          <KYCManagement />
        </TabsContent>

        <TabsContent value="aml" className="space-y-6">
          <AMLMonitoring />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <DocumentManagement />
        </TabsContent>
      </Tabs>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Customer Details: {selectedCustomer.name}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-sm text-gray-900">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Country</label>
                    <p className="text-sm text-gray-900">{selectedCustomer.country}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Join Date</label>
                    <p className="text-sm text-gray-900">{selectedCustomer.joinDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Volume</label>
                    <p className="text-sm text-gray-900">${selectedCustomer.totalVolume.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">AML Risk Score</label>
                  <div className="flex items-center gap-3">
                    <Progress value={selectedCustomer.amlRiskScore} className="flex-1 h-3" />
                    <span className="text-sm font-medium">{selectedCustomer.amlRiskScore}/100</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Documents</label>
                  <div className="space-y-2">
                    {selectedCustomer.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium">{doc.type.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-500">Uploaded {doc.uploadDate}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ComplianceDashboard;
