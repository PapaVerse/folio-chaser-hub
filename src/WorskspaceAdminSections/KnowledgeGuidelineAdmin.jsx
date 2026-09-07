import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, FileText, Trash2, Edit2, X, Plus, Calendar, User, Download, FileSpreadsheet, Presentation, AlertTriangle, Search, Link as LinkIcon } from 'lucide-react';

export default function KnowledgeGuidelineAdmin({ currentUser, isDarkMode }) {
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

      if (externalUrl.trim()) {
        fileUrl = externalUrl.trim();
        fileName = externalUrl.trim();
      } 
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

  const confirmDelete = (doc) => {
    setDocToDelete(doc);
    setDeleteModalOpen(true);
  };

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
    if (fileUrl && !fileUrl.includes('guidelines')) return <LinkIcon size={20} color={isDarkMode ? '#fb923c' : '#ea580c'} />;
    if (!fileName) return <FileText size={20} color={isDarkMode ? '#60a5fa' : '#2563eb'} />;
    const ext = fileName.split('.').pop().toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet size={20} color={isDarkMode ? '#4ade80' : '#16a34a'} />;
    if (['ppt', 'pptx'].includes(ext)) return <Presentation size={20} color={isDarkMode ? '#fb923c' : '#ea580c'} />;
    if (ext === 'pdf') return <FileText size={20} color={isDarkMode ? '#f87171' : '#dc2626'} />;
    return <FileText size={20} color={isDarkMode ? '#60a5fa' : '#2563eb'} />;
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} style={{ backgroundColor: isDarkMode ? '#713f12' : '#fef08a', color: isDarkMode ? '#fde047' : '#854d0e', padding: '0 2px', borderRadius: '2px', fontWeight: '700' }}>
          {part}
        </span>
      ) : part
    );
  };

  const filteredDocs = documents.filter(doc => {
    const matchesTab = activeTab === 'All' || doc.department === activeTab;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (doc.file_name && doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  // Dynamic Theme Colors based on isDarkMode prop
  const theme = {
    bg: isDarkMode ? '#0f172a' : '#ffffff',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    textMain: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    subtleBg: isDarkMode ? '#111827' : '#f8fafc',
    inputBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputBorder: isDarkMode ? '#475569' : '#cbd5e1',
    tabActiveBg: isDarkMode ? '#1e3a8a' : '#eff6ff',
    tabActiveText: isDarkMode ? '#93c5fd' : '#2563eb',
    tabActiveBorder: isDarkMode ? '#3b82f6' : '#bfdbfe',
    badgeBg: isDarkMode ? '#334155' : '#f1f5f9',
    badgeText: isDarkMode ? '#cbd5e1' : '#475569',
  };

  return (
    <div style={{ background: theme.bg, color: theme.textMain, padding: '30px', borderRadius: '16px', border: `1px solid ${theme.border}`, minHeight: '600px', boxSizing: 'border-box', transition: 'background 0.3s, color 0.3s' }}>
      
      {/* Header, Search Input & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: theme.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color={isDarkMode ? '#60a5fa' : '#2563eb'} /> Knowledge Base & SOP Guidelines
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: theme.textMuted }}>Manage standard operating procedures, documentation, and process files grouped by department.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={16} color={theme.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search guidelines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.textMain, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
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

      {/* Dynamic Department Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${theme.border}`, marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        
        <button
          onClick={() => setActiveTab('All')}
          style={{
            padding: '10px 16px',
            background: activeTab === 'All' ? theme.tabActiveBg : 'transparent',
            color: activeTab === 'All' ? theme.tabActiveText : theme.textMuted,
            border: activeTab === 'All' ? `1px solid ${theme.tabActiveBorder}` : '1px solid transparent',
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
          <span style={{ background: activeTab === 'All' ? (isDarkMode ? '#1e40af' : '#dbeafe') : theme.badgeBg, color: activeTab === 'All' ? (isDarkMode ? '#bfdbfe' : '#1d4ed8') : theme.badgeText, padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
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
                background: isActive ? theme.tabActiveBg : 'transparent',
                color: isActive ? theme.tabActiveText : theme.textMuted,
                border: isActive ? `1px solid ${theme.tabActiveBorder}` : '1px solid transparent',
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
              <span style={{ background: isActive ? (isDarkMode ? '#1e40af' : '#dbeafe') : theme.badgeBg, color: isActive ? (isDarkMode ? '#bfdbfe' : '#1d4ed8') : theme.badgeText, padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Documents Container Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredDocs.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: theme.textMuted, background: theme.subtleBg, borderRadius: '12px', border: `1px dashed ${theme.inputBorder}` }}>
            <BookOpen size={36} color={theme.textMuted} style={{ marginBottom: '10px' }} />
            <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '14px', color: theme.textMain }}>
              {searchTerm ? `No guidelines match "${searchTerm}"` : `No guidelines uploaded for ${activeTab}`}
            </p>
            <p style={{ margin: 0, fontSize: '12px' }}>Try adjusting your search query or selecting another tab.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isExternalLink = doc.file_url && !doc.file_url.includes('guidelines');
            return (
              <div key={doc.id} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.02)', position: 'relative' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: theme.subtleBg, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}>
                        {getFileIcon(doc.file_name, doc.file_url)}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', background: theme.badgeBg, color: theme.badgeText, padding: '4px 8px', borderRadius: '6px' }}>
                        {doc.department}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => openModal(doc)}
                        title="Edit Document Info"
                        style={{ background: theme.subtleBg, border: `1px solid ${theme.border}`, borderRadius: '6px', padding: '6px', cursor: 'pointer', color: theme.textMuted, display: 'flex', alignItems: 'center' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => confirmDelete(doc)}
                        title="Delete Document"
                        style={{ background: isDarkMode ? '#450a0a' : '#fef2f2', border: `1px solid ${isDarkMode ? '#7f1d1d' : '#fecaca'}`, borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: theme.textMain, lineHeight: '1.4', wordBreak: 'break-word' }}>
                    {highlightMatch(doc.title, searchTerm)}
                  </h3>
                  
                  <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: theme.textMuted, wordBreak: 'break-all' }}>
                    {isExternalLink ? `🔗 ${highlightMatch(doc.file_url, searchTerm)}` : `📁 ${highlightMatch(doc.file_name || 'Attached File', searchTerm)}`}
                  </p>
                </div>

                <div>
                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: theme.textMuted }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={12} color={theme.textMuted} />
                      <span>Uploaded by <strong style={{ color: theme.textMain }}>{doc.uploaded_by || 'Administrator'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} color={theme.textMuted} />
                      <span>{new Date(doc.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>

                  {doc.file_url && (
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ marginTop: '14px', width: '100%', padding: '8px 12px', background: isExternalLink ? (isDarkMode ? '#4a044e' : '#fdf4ff') : (isDarkMode ? '#1e3a8a' : '#eff6ff'), color: isExternalLink ? (isDarkMode ? '#e879f9' : '#c026d3') : (isDarkMode ? '#93c5fd' : '#2563eb'), border: `1px solid ${isExternalLink ? (isDarkMode ? '#701a75' : '#f5d0fe') : (isDarkMode ? '#3b82f6' : '#bfdbfe')}`, borderRadius: '6px', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', boxSizing: 'border-box' }}
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: theme.cardBg, color: theme.textMain, borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', boxSizing: 'border-box', textAlign: 'center' }}>
            
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: isDarkMode ? '#450a0a' : '#fef2f2', border: `1px solid ${isDarkMode ? '#7f1d1d' : '#fecaca'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#dc2626' }}>
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '800', color: theme.textMain }}>
              Delete Document?
            </h3>
            
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: theme.textMuted, lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: theme.textMain }}>"{docToDelete?.title}"</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => { setDeleteModalOpen(false); setDocToDelete(null); }}
                style={{ flex: 1, padding: '10px 16px', background: theme.subtleBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: theme.textMain }}
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: theme.cardBg, color: theme.textMain, borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', boxSizing: 'border-box' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: theme.textMain }}>
                {editingDoc ? 'Edit SOP / Document' : 'Upload New SOP Document'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.textMain, marginBottom: '6px' }}>Document Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g., Invoice Folio Collection SOP v2.1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.textMain, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.textMain, marginBottom: '6px' }}>Department *</label>
                <select 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', outline: 'none', background: theme.inputBg, color: theme.textMain, boxSizing: 'border-box' }}
                >
                  {departmentsList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Option A: Upload File */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.textMain, marginBottom: '6px' }}>
                  Upload File (PDF, XLSX, DOCX, PPT)
                </label>
                <input 
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv"
                  onChange={(e) => {
                    setFile(e.target.files[0]);
                    if (e.target.files[0]) setExternalUrl('');
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', background: theme.subtleBg, color: theme.textMain, boxSizing: 'border-box' }}
                />
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', color: theme.textMuted, fontSize: '11px', fontWeight: '600', margin: '2px 0' }}>
                <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}` }}></div>
                <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or Provide External Link</span>
                <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}` }}></div>
              </div>

              {/* Option B: Clickable Link URL */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.textMain, marginBottom: '6px' }}>
                  Clickable Web Link (URL)
                </label>
                <input 
                  type="url"
                  placeholder="https://example.com/guideline-doc or Notion/Google Doc link"
                  value={externalUrl}
                  onChange={(e) => {
                    setExternalUrl(e.target.value);
                    if (e.target.value) setFile(null);
                  }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.textMain, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px', display: 'block' }}>
                  When users click this link, it will open securely in a new browser tab (`target="_blank"`).
                </span>
              </div>

              {editingDoc && !file && !externalUrl && (
                <div style={{ background: theme.subtleBg, padding: '8px 12px', borderRadius: '6px', border: `1px solid ${theme.border}` }}>
                  <span style={{ fontSize: '11px', color: theme.textMuted, display: 'block' }}>Current attached resource: <strong style={{ color: theme.textMain }}>{editingDoc.file_name || editingDoc.file_url}</strong></span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={closeModal}
                  style={{ padding: '10px 16px', background: theme.subtleBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: theme.textMain }}
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