import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, FileText, Trash2, Edit2, X, Plus, Calendar, User, Download, FileSpreadsheet, Presentation, AlertTriangle, Search, Link as LinkIcon } from 'lucide-react';

export default function KnowledgeGuidelineAdmin({ currentUser }) {
  const [documents, setDocuments] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  // Modern Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [file, setFile] = useState(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Department tabs, search state
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [guidelinesRes, usersRes] = await Promise.all([
      supabase.from('knowledge_guidelines').select('*').order('created_at', { ascending: false }),
      supabase.from('app_users').select('department')
    ]);

    if (guidelinesRes.error) {
      console.error('Error fetching guidelines:', guidelinesRes.error);
    } else {
      setDocuments(guidelinesRes.data || []);
    }

    if (!usersRes.error && usersRes.data) {
      const dbDepts = usersRes.data
        .map(u => u.department)
        .filter(dept => dept && dept.trim() !== '');
      
      const uniqueDepts = Array.from(new Set(dbDepts));
      const finalDepts = uniqueDepts.length > 0 ? uniqueDepts : ['Operations', 'Admin'];
      
      setDepartmentsList(finalDepts);
      
      // Default to 'All' on load if not already set to a valid department
      setActiveTab(prev => (prev === 'All' || finalDepts.includes(prev) ? (prev || 'All') : 'All'));
      setDepartment(prev => (prev && finalDepts.includes(prev) ? prev : finalDepts[0]));
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!title.trim() || (!file && !externalUrl.trim() && !editingDoc)) {
      alert('Please provide a title and either select a file or provide a clickable link URL.');
      return;
    }

    setUploading(true);

    try {
      let fileUrl = editingDoc?.file_url || '';
      let fileName = editingDoc?.file_name || '';

      // Handle External Clickable Link if provided
      if (externalUrl.trim()) {
        fileUrl = externalUrl.trim();
        fileName = externalUrl.trim();
      } 
      // Otherwise handle File upload if a new file is selected
      else if (file) {
        const fileExt = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'];
        if (!allowedExtensions.includes(fileExt)) {
          alert('Invalid file format. Please upload PDF, DOC/DOCX, XLS/XLSX, or PPT/PPTX files.');
          setUploading(false);
          return;
        }

        const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${department.toLowerCase().replace(/[^a-z0-9]/g, '_')}/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('guidelines')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from('guidelines')
          .getPublicUrl(filePath);

        fileUrl = publicURLData.publicUrl;
        fileName = file.name;
      }

      const uploaderName = currentUser?.employee_name || currentUser?.name || 'Administrator';

      if (editingDoc) {
        const { error: updateError } = await supabase
          .from('knowledge_guidelines')
          .update({
            title,
            department,
            file_url: fileUrl,
            file_name: fileName,
          })
          .eq('id', editingDoc.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('knowledge_guidelines')
          .insert([{
            title,
            department,
            file_url: fileUrl,
            file_name: fileName,
            uploaded_by: uploaderName,
          }]);

        if (insertError) throw insertError;
      }

      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error saving guideline:', error);
      alert('Failed to save document. Make sure the storage bucket "guidelines" exists in Supabase if uploading files.');
    } finally {
      setUploading(false);
    }
  };

  // Trigger modern delete popup prompt
  const confirmDelete = (doc) => {
    setDocToDelete(doc);
    setDeleteModalOpen(true);
  };

  // Execute actual deletion from Supabase
  const handleDeleteExecute = async () => {
    if (!docToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('knowledge_guidelines')
        .delete()
        .eq('id', docToDelete.id);

      if (error) throw error;
      setDeleteModalOpen(false);
      setDocToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document.');
    } finally {
      setDeleting(false);
    }
  };

  const openModal = (doc = null) => {
    if (doc) {
      setEditingDoc(doc);
      setTitle(doc.title);
      setDepartment(doc.department);
      setFile(null);
      // Check if current file_url is an external link (doesn't point to Supabase storage guidelines bucket)
      const isExternal = doc.file_url && !doc.file_url.includes('guidelines');
      setExternalUrl(isExternal ? doc.file_url : '');
    } else {
      setEditingDoc(null);
      setTitle('');
      setDepartment(activeTab !== 'All' ? activeTab : departmentsList[0]);
      setFile(null);
      setExternalUrl('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
    setTitle('');
    setFile(null);
    setExternalUrl('');
  };

  const getFileIcon = (fileName, fileUrl) => {
    if (fileUrl && !fileUrl.includes('guidelines')) return <LinkIcon size={20} color="#ea580c" />;
    if (!fileName) return <FileText size={20} color="#2563eb" />;
    const ext = fileName.split('.').pop().toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet size={20} color="#16a34a" />;
    if (['ppt', 'pptx'].includes(ext)) return <Presentation size={20} color="#ea580c" />;
    if (ext === 'pdf') return <FileText size={20} color="#dc2626" />;
    return <FileText size={20} color="#2563eb" />;
  };

  // Search Highlight Helper
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '0 2px', borderRadius: '2px', fontWeight: '700' }}>
          {part}
        </span>
      ) : part
    );
  };

  // Filtered documents by Department Tab & Search Query
  const filteredDocs = documents.filter(doc => {
    const matchesTab = activeTab === 'All' || doc.department === activeTab;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (doc.file_name && doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '600px', boxSizing: 'border-box' }}>
      
      {/* Header, Search Input & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="#2563eb" /> Knowledge Base & SOP Guidelines
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Manage standard operating procedures, documentation, and process files grouped by department.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search guidelines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            onClick={() => openModal()}
            style={{ padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          >
            <Plus size={16} /> Upload New SOP / Doc
          </button>
        </div>
      </div>

      {/* Dynamic Department Navigation Tabs (Includes "All Departments") */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        
        {/* All Departments Tab */}
        <button
          onClick={() => setActiveTab('All')}
          style={{
            padding: '10px 16px',
            background: activeTab === 'All' ? '#eff6ff' : 'transparent',
            color: activeTab === 'All' ? '#2563eb' : '#64748b',
            border: activeTab === 'All' ? '1px solid #bfdbfe' : '1px solid transparent',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <span>All Departments</span>
          <span style={{ background: activeTab === 'All' ? '#dbeafe' : '#f1f5f9', color: activeTab === 'All' ? '#1d4ed8' : '#64748b', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
            {documents.length}
          </span>
        </button>

        {departmentsList.map((dept) => {
          const count = documents.filter(d => d.department === dept).length;
          const isActive = activeTab === dept;
          return (
            <button
              key={dept}
              onClick={() => setActiveTab(dept)}
              style={{
                padding: '10px 16px',
                background: isActive ? '#eff6ff' : 'transparent',
                color: isActive ? '#2563eb' : '#64748b',
                border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <span>{dept}</span>
              <span style={{ background: isActive ? '#dbeafe' : '#f1f5f9', color: isActive ? '#1d4ed8' : '#64748b', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Documents Container Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredDocs.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <BookOpen size={36} color="#cbd5e1" style={{ marginBottom: '10px' }} />
            <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '14px', color: '#475569' }}>
              {searchTerm ? `No guidelines match "${searchTerm}"` : `No guidelines uploaded for ${activeTab}`}
            </p>
            <p style={{ margin: 0, fontSize: '12px' }}>Try adjusting your search query or selecting another tab.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isExternalLink = doc.file_url && !doc.file_url.includes('guidelines');
            return (
              <div key={doc.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}>
                        {getFileIcon(doc.file_name, doc.file_url)}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px' }}>
                        {doc.department}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => openModal(doc)}
                        title="Edit Document Info"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => confirmDelete(doc)}
                        title="Delete Document"
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a', lineHeight: '1.4', wordBreak: 'break-word' }}>
                    {highlightMatch(doc.title, searchTerm)}
                  </h3>
                  
                  <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b', wordBreak: 'break-all' }}>
                    {isExternalLink ? `🔗 ${highlightMatch(doc.file_url, searchTerm)}` : `📁 ${highlightMatch(doc.file_name || 'Attached File', searchTerm)}`}
                  </p>
                </div>

                <div>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={12} color="#94a3b8" />
                      <span>Uploaded by <strong>{doc.uploaded_by || 'Administrator'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} color="#94a3b8" />
                      <span>{new Date(doc.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>

                  {doc.file_url && (
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ marginTop: '14px', width: '100%', padding: '8px 12px', background: isExternalLink ? '#fdf4ff' : '#eff6ff', color: isExternalLink ? '#c026d3' : '#2563eb', border: `1px solid ${isExternalLink ? '#f5d0fe' : '#bfdbfe'}`, borderRadius: '6px', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', boxSizing: 'border-box' }}
                    >
                      {isExternalLink ? <LinkIcon size={13} /> : <Download size={13} />}
                      {isExternalLink ? 'Open External Link' : 'View / Download File'}
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modern Delete Confirmation Dialog Modal */}
      {deleteModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', boxSizing: 'border-box', textAlign: 'center' }}>
            
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#dc2626' }}>
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
              Delete Document?
            </h3>
            
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: '#1e293b' }}>"{docToDelete?.title}"</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => { setDeleteModalOpen(false); setDocToDelete(null); }}
                style={{ flex: 1, padding: '10px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: '#334155' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={deleting}
                onClick={handleDeleteExecute}
                style={{ flex: 1, padding: '10px 16px', background: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: deleting ? 'not-allowed' : 'pointer', color: '#fff' }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Upload / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                {editingDoc ? 'Edit SOP / Document' : 'Upload New SOP Document'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Document Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g., Invoice Folio Collection SOP v2.1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Department *</label>
                <select 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                >
                  {departmentsList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Option A: Upload File */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Upload File (PDF, XLSX, DOCX, PPT)
                </label>
                <input 
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv"
                  onChange={(e) => {
                    setFile(e.target.files[0]);
                    if (e.target.files[0]) setExternalUrl(''); // Clear link if file is chosen
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              {/* Divider / Choice Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', color: '#94a3b8', fontSize: '11px', fontWeight: '600', margin: '2px 0' }}>
                <div style={{ flex: 1, borderBottom: '1px solid #e2e8f0' }}></div>
                <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or Provide External Link</span>
                <div style={{ flex: 1, borderBottom: '1px solid #e2e8f0' }}></div>
              </div>

              {/* Option B: Clickable Link URL */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Clickable Web Link (URL)
                </label>
                <input 
                  type="url"
                  placeholder="https://example.com/guideline-doc or Notion/Google Doc link"
                  value={externalUrl}
                  onChange={(e) => {
                    setExternalUrl(e.target.value);
                    if (e.target.value) setFile(null); // Clear file if URL is typed
                  }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  When users click this link, it will open securely in a new browser tab (`target="_blank"`).
                </span>
              </div>

              {editingDoc && !file && !externalUrl && (
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Current attached resource: <strong>{editingDoc.file_name || editingDoc.file_url}</strong></span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={closeModal}
                  style={{ padding: '10px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: '#334155' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  style={{ padding: '10px 20px', background: '#2563eb', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: uploading ? 'not-allowed' : 'pointer', color: '#fff' }}
                >
                  {uploading ? 'Saving...' : (editingDoc ? 'Save Changes' : 'Publish Resource')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}