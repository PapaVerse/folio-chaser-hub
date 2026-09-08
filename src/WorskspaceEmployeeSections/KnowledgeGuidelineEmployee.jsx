import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, FileText, Calendar, User, Download, FileSpreadsheet, Presentation, Search, Edit3, X, Upload, CheckCircle2, Link as LinkIcon, PlusCircle, Trash2 } from 'lucide-react';

export default function KnowledgeGuidelineEmployee({ currentUser, isDarkMode }) {
  const [documents, setDocuments] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit / Replace File State
  const [editingDoc, setEditingDoc] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [fileError, setFileError] = useState('');

  // New Guideline Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newFile, setNewFile] = useState(null);
  const [newExternalUrl, setNewExternalUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [addFileError, setAddFileError] = useState('');
  const [addSuccessMessage, setAddSuccessMessage] = useState('');

  // Delete Confirmation State
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Dynamic Theme Colors based on isDarkMode prop
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    cardBorder: isDarkMode ? '#334155' : '#e2e8f0',
    titleMain: isDarkMode ? '#f8fafc' : '#0f172a',
    titleSub: isDarkMode ? '#94a3b8' : '#64748b',
    inputBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputBorder: isDarkMode ? '#475569' : '#cbd5e1',
    inputColor: isDarkMode ? '#f8fafc' : '#0f172a',
    tabBgActive: isDarkMode ? '#172554' : '#eff6ff',
    tabBorderActive: isDarkMode ? '#1e3a8a' : '#bfdbfe',
    tabColorActive: isDarkMode ? '#93c5fd' : '#2563eb',
    tabCountBgActive: isDarkMode ? '#1e3a8a' : '#dbeafe',
    tabCountColorActive: isDarkMode ? '#bfdbfe' : '#1d4ed8',
    tabBgInactive: isDarkMode ? '#0f172a' : '#f1f5f9',
    tabColorInactive: isDarkMode ? '#94a3b8' : '#64748b',
    docCardBg: isDarkMode ? '#1e293b' : '#ffffff',
    docCardBorder: isDarkMode ? '#334155' : '#e2e8f0',
    docIconBg: isDarkMode ? '#0f172a' : '#f8fafc',
    docIconBorder: isDarkMode ? '#334155' : '#334155',
    badgeBg: isDarkMode ? '#0f172a' : '#f1f5f9',
    badgeColor: isDarkMode ? '#cbd5e1' : '#475569',
    dividerColor: isDarkMode ? '#334155' : '#f1f5f9',
    modalBg: isDarkMode ? '#1e293b' : '#ffffff',
    modalBorder: isDarkMode ? '#334155' : '#e2e8f0',
    dropzoneBg: isDarkMode ? '#0f172a' : '#f8fafc',
    dropzoneBorder: isDarkMode ? '#475569' : '#cbd5e1',
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [guidelinesRes, usersRes] = await Promise.all([
      supabase.from('knowledge_guidelines').select('*').order('created_at', { ascending: false }),
      supabase.from('app_users').select('department')
    ]);

    if (!guidelinesRes.error) {
      setDocuments(guidelinesRes.data || []);
    }

    if (!usersRes.error && usersRes.data) {
      const dbDepts = usersRes.data
        .map(u => u.department)
        .filter(dept => dept && dept.trim() !== '');
      
      const uniqueDepts = Array.from(new Set(dbDepts));
      const finalDepts = uniqueDepts.length > 0 ? uniqueDepts : ['Operations', 'Admin'];
      
      setDepartmentsList(finalDepts);
      if (!newDepartment && finalDepts.length > 0) {
        setNewDepartment(finalDepts[0]);
      }
      
      const empDept = currentUser?.department;
      if (empDept && finalDepts.includes(empDept)) {
        setActiveTab(empDept);
      } else if (!activeTab) {
        setActiveTab(finalDepts[0]);
      }
    }
    setLoading(false);
  };

  const getFileIcon = (fileName, fileUrl) => {
    if (fileUrl && !fileUrl.includes('guidelines') && !fileUrl.includes('documents')) return <LinkIcon size={20} color="#ea580c" />;
    if (!fileName) return <FileText size={20} color="#2563eb" />;
    const ext = fileName.split('.').pop().toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet size={20} color="#16a34a" />;
    if (['ppt', 'pptx'].includes(ext)) return <Presentation size={20} color="#ea580c" />;
    if (['pdf'].includes(ext)) return <FileText size={20} color="#dc2626" />;
    if (['doc', 'docx'].includes(ext)) return <FileText size={20} color="#2563eb" />;
    return <FileText size={20} color="#2563eb" />;
  };

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

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc);
    setEditTitle(doc.title || '');
    setSelectedFile(null);
    const isExternal = doc.file_url && !doc.file_url.includes('guidelines') && !doc.file_url.includes('documents');
    setExternalUrl(isExternal ? doc.file_url : '');
    setFileError('');
    setSuccessMessage('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'];
    const fileExt = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      setFileError('Invalid file format. Please upload PDF, DOC/DOCX, PPT/PPTX, or XLS/XLSX files.');
      setSelectedFile(null);
      return;
    }

    setFileError('');
    setSelectedFile(file);
    setExternalUrl('');
  };

  const handleNewFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'];
    const fileExt = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      setAddFileError('Invalid file format. Please upload PDF, DOC/DOCX, PPT/PPTX, or XLS/XLSX files.');
      setNewFile(null);
      return;
    }

    setAddFileError('');
    setNewFile(file);
    setNewExternalUrl('');
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;
    setUpdating(true);

    try {
      let fileUrl = editingDoc.file_url;
      let fileName = editingDoc.file_name;

      if (externalUrl.trim()) {
        fileUrl = externalUrl.trim();
        fileName = externalUrl.trim();
      } else if (selectedFile) {
        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const uniqueFileName = `${Date.now()}_${cleanName}`;
        const filePath = `guidelines/${uniqueFileName}`;

        let uploadResult = await supabase.storage.from('documents').upload(filePath, selectedFile, { upsert: true });
        let bucketUsed = 'documents';

        if (uploadResult.error) {
          uploadResult = await supabase.storage.from('guidelines').upload(filePath, selectedFile, { upsert: true });
          bucketUsed = 'guidelines';
          if (uploadResult.error) {
            throw new Error(uploadResult.error.message || 'Storage upload policy restricted this action.');
          }
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucketUsed)
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          fileUrl = publicUrlData.publicUrl;
        }
        fileName = selectedFile.name;
      }

      const { error: updateError } = await supabase
        .from('knowledge_guidelines')
        .update({
          title: editTitle,
          file_name: fileName,
          file_url: fileUrl,
          uploaded_by: currentUser?.employee_name || currentUser?.name || editingDoc.uploaded_by
        })
        .eq('id', editingDoc.id);

      if (updateError) throw updateError;

      setSuccessMessage('Guideline and file version updated successfully!');
      setTimeout(() => {
        setEditingDoc(null);
        fetchData();
      }, 1200);

    } catch (err) {
      console.error('Error updating guideline file:', err);
      alert(`Failed to replace file: ${err.message || 'Check Supabase RLS storage policies.'}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);

    try {
      let fileUrl = '';
      let fileName = '';

      if (newExternalUrl.trim()) {
        fileUrl = newExternalUrl.trim();
        fileName = newExternalUrl.trim();
      } else if (newFile) {
        const cleanName = newFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const uniqueFileName = `${Date.now()}_${cleanName}`;
        const filePath = `guidelines/${uniqueFileName}`;

        let uploadResult = await supabase.storage.from('documents').upload(filePath, newFile, { upsert: true });
        let bucketUsed = 'documents';

        if (uploadResult.error) {
          uploadResult = await supabase.storage.from('guidelines').upload(filePath, newFile, { upsert: true });
          bucketUsed = 'guidelines';
          if (uploadResult.error) {
            throw new Error(uploadResult.error.message || 'Storage upload policy restricted this action.');
          }
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucketUsed)
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          fileUrl = publicUrlData.publicUrl;
        }
        fileName = newFile.name;
      }

      const { error: insertError } = await supabase
        .from('knowledge_guidelines')
        .insert([{
          title: newTitle.trim(),
          department: newDepartment || departmentsList[0] || 'Operations',
          file_name: fileName,
          file_url: fileUrl,
          uploaded_by: currentUser?.employee_name || currentUser?.name || 'Administrator'
        }]);

      if (insertError) throw insertError;

      setAddSuccessMessage('New guideline added successfully!');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setNewTitle('');
        setNewFile(null);
        setNewExternalUrl('');
        setAddSuccessMessage('');
        fetchData();
      }, 1200);

    } catch (err) {
      console.error('Error adding new guideline:', err);
      alert(`Failed to add guideline: ${err.message || 'Check Supabase table or RLS policies.'}`);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return;
    setDeleting(true);

    try {
      const { error: deleteError } = await supabase
        .from('knowledge_guidelines')
        .delete()
        .eq('id', deletingDoc.id);

      if (deleteError) throw deleteError;

      setDeletingDoc(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting guideline:', err);
      alert(`Failed to delete guideline: ${err.message || 'Check Supabase RLS delete policies.'}`);
    } finally {
      setDeleting(false);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesDept = activeTab === 'All' || doc.department === activeTab;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (doc.file_name && doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  return (
    <div style={{ background: theme.cardBg, padding: 'clamp(15px, 3vw, 30px)', borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, minHeight: '600px', boxSizing: 'border-box', position: 'relative', width: '100%', overflowX: 'hidden' }}>
      
      {/* Header & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: theme.titleMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color={isDarkMode ? '#93c5fd' : '#2563eb'} /> Knowledge Base & SOP Guidelines
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: theme.titleSub }}>Access standard operating procedures, documentation, and update guideline versions.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setNewTitle('');
              setNewFile(null);
              setNewExternalUrl('');
              setAddFileError('');
              setAddSuccessMessage('');
            }}
            style={{ padding: '9px 16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <PlusCircle size={16} /> Add Guideline
          </button>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search guidelines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: theme.inputBg, color: theme.inputColor }}
            />
          </div>
        </div>
      </div>

      {/* Department Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${theme.cardBorder}`, marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('All')}
          style={{
            padding: '10px 16px',
            background: activeTab === 'All' ? theme.tabBgActive : 'transparent',
            color: activeTab === 'All' ? theme.tabColorActive : theme.titleSub,
            border: activeTab === 'All' ? `1px solid ${theme.tabBorderActive}` : '1px solid transparent',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>All Departments</span>
          <span style={{ background: activeTab === 'All' ? theme.tabCountBgActive : theme.tabBgInactive, color: activeTab === 'All' ? theme.tabCountColorActive : theme.titleSub, padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
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
                background: isActive ? theme.tabBgActive : 'transparent',
                color: isActive ? theme.tabColorActive : theme.titleSub,
                border: isActive ? `1px solid ${theme.tabBorderActive}` : '1px solid transparent',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{dept}</span>
              <span style={{ background: isActive ? theme.tabCountBgActive : theme.tabBgInactive, color: isActive ? theme.tabCountColorActive : theme.titleSub, padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: theme.titleSub, fontSize: '14px' }}>Loading guidelines...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredDocs.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: theme.titleSub, background: theme.tabBgInactive, borderRadius: '12px', border: `1px dashed ${theme.inputBorder}` }}>
              <BookOpen size={36} color="#cbd5e1" style={{ marginBottom: '10px' }} />
              <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '14px', color: theme.titleMain }}>No guidelines found</p>
              <p style={{ margin: 0, fontSize: '12px' }}>Try adjusting your search or selecting a different department tab.</p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isExternalLink = doc.file_url && !doc.file_url.includes('guidelines') && !doc.file_url.includes('documents');
              return (
                <div key={doc.id} style={{ background: theme.docCardBg, border: `1px solid ${theme.docCardBorder}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: theme.docIconBg, border: `1px solid ${theme.docIconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}>
                        {getFileIcon(doc.file_name, doc.file_url)}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', background: theme.badgeBg, color: theme.badgeColor, padding: '4px 8px', borderRadius: '6px' }}>
                          {doc.department}
                        </span>
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          style={{ background: theme.badgeBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', color: isDarkMode ? '#93c5fd' : '#2563eb' }}
                          title="Update Title / Replace File Version"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => setDeletingDoc(doc)}
                          style={{ background: isDarkMode ? '#450a0a' : '#fef2f2', border: `1px solid ${isDarkMode ? '#7f1d1d' : '#fecaca'}`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', color: isDarkMode ? '#fca5a5' : '#dc2626' }}
                          title="Delete Guideline"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: theme.titleMain, lineHeight: '1.4', wordBreak: 'break-word' }}>
                      {highlightMatch(doc.title, searchTerm)}
                    </h3>
                    
                    <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: theme.titleSub, wordBreak: 'break-all' }}>
                      {isExternalLink ? `🔗 ${highlightMatch(doc.file_url, searchTerm)}` : `📁 ${highlightMatch(doc.file_name || 'Attached File', searchTerm)}`}
                    </p>
                  </div>

                  <div>
                    <div style={{ borderTop: `1px solid ${theme.dividerColor}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: theme.titleSub }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={12} color="#94a3b8" />
                        <span>Updated by <strong style={{ color: theme.titleMain }}>{doc.uploaded_by || 'Administrator'}</strong></span>
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
                        style={{ marginTop: '14px', width: '100%', padding: '8px 12px', background: isExternalLink ? (isDarkMode ? '#3b0764' : '#fdf4ff') : (isDarkMode ? '#172554' : '#eff6ff'), color: isExternalLink ? (isDarkMode ? '#e879f9' : '#c026d3') : (isDarkMode ? '#93c5fd' : '#2563eb'), border: `1px solid ${isExternalLink ? (isDarkMode ? '#701a75' : '#f5d0fe') : (isDarkMode ? '#1e3a8a' : '#bfdbfe')}`, borderRadius: '6px', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', boxSizing: 'border-box' }}
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
      )}

      {/* Add New Guideline Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: theme.modalBg, borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: `1px solid ${theme.modalBorder}`, boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: theme.titleMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={18} color={isDarkMode ? '#93c5fd' : '#2563eb'} /> Add New Guideline
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: theme.tabBgInactive, border: 'none', borderRadius: '6px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.titleSub }}
              >
                <X size={16} />
              </button>
            </div>

            {addSuccessMessage ? (
              <div style={{ background: isDarkMode ? '#064e3b' : '#f0fdf4', border: `1px solid ${isDarkMode ? '#065f46' : '#bbf7d0'}`, color: isDarkMode ? '#34d399' : '#16a34a', padding: '16px', borderRadius: '8px', textAlign: 'center', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> {addSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.titleSub, marginBottom: '6px' }}>
                    Document Title *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g., Q3 Invoice Processing SOP"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: theme.inputBg, color: theme.inputColor }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.titleSub, marginBottom: '6px' }}>
                    Department *
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: theme.inputBg, color: theme.inputColor }}
                  >
                    {departmentsList.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.titleSub, marginBottom: '6px' }}>
                    Upload File (Supported: PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX)
                  </label>
                  <div style={{ border: `2px dashed ${theme.dropzoneBorder}`, borderRadius: '8px', padding: '16px', textAlign: 'center', background: theme.dropzoneBg }}>
                    <Upload size={22} color="#64748b" style={{ marginBottom: '6px' }} />
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '600', color: theme.titleMain }}>
                      {newFile ? newFile.name : 'Choose a file to upload'}
                    </p>
                    <input 
                      type="file"
                      id="new-file-input"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv"
                      onChange={handleNewFileChange}
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="new-file-input"
                      style={{ display: 'inline-block', padding: '6px 12px', background: isDarkMode ? '#1e3a8a' : '#e0f2fe', color: isDarkMode ? '#93c5fd' : '#0369a1', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Browse File
                    </label>
                  </div>
                  {addFileError && <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>{addFileError}</p>}
                </div>

                {/* Divider / Choice Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', color: theme.titleSub, fontSize: '11px', fontWeight: '600', margin: '0' }}>
                  <div style={{ flex: 1, borderBottom: `1px solid ${theme.cardBorder}` }}></div>
                  <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or External Link URL</span>
                  <div style={{ flex: 1, borderBottom: `1px solid ${theme.cardBorder}` }}></div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.titleSub, marginBottom: '6px' }}>
                    External Web Link (URL)
                  </label>
                  <input 
                    type="url"
                    placeholder="https://example.com/guideline-doc"
                    value={newExternalUrl}
                    onChange={(e) => {
                      setNewExternalUrl(e.target.value);
                      if (e.target.value) setNewFile(null);
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: theme.inputBg, color: theme.inputColor }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={{ padding: '9px 16px', background: theme.tabBgInactive, border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: theme.titleSub }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={adding}
                    style={{ padding: '9px 18px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', opacity: adding ? 0.7 : 1 }}
                  >
                    {adding ? 'Adding Guideline...' : 'Save Guideline'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Edit / Replace Modal */}
      {editingDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: theme.modalBg, borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: `1px solid ${theme.modalBorder}`, boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: theme.titleMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color={isDarkMode ? '#93c5fd' : '#2563eb'} /> Update Guideline & File
              </h3>
              <button 
                onClick={() => setEditingDoc(null)}
                style={{ background: theme.tabBgInactive, border: 'none', borderRadius: '6px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.titleSub }}
              >
                <X size={16} />
              </button>
            </div>

            {successMessage ? (
              <div style={{ background: isDarkMode ? '#064e3b' : '#f0fdf4', border: `1px solid ${isDarkMode ? '#065f46' : '#bbf7d0'}`, color: isDarkMode ? '#34d399' : '#16a34a', padding: '16px', borderRadius: '8px', textAlign: 'center', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> {successMessage}
              </div>
            ) : (
              <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.titleSub, marginBottom: '6px' }}>
                    Document Title
                  </label>
                  <input 
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: theme.inputBg, color: theme.inputColor }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.titleSub, marginBottom: '6px' }}>
                    Replace File (Supported: PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX)
                  </label>
                  <div style={{ border: `2px dashed ${theme.dropzoneBorder}`, borderRadius: '8px', padding: '16px', textAlign: 'center', background: theme.dropzoneBg }}>
                    <Upload size={22} color="#64748b" style={{ marginBottom: '6px' }} />
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: theme.titleMain }}>
                      {selectedFile ? selectedFile.name : 'Choose a new file to replace current version'}
                    </p>
                    <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: theme.titleSub }}>Current: {editingDoc.file_name || 'None'}</p>
                    <input 
                      type="file"
                      id="update-file-input"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="update-file-input"
                      style={{ display: 'inline-block', padding: '6px 12px', background: isDarkMode ? '#1e3a8a' : '#e0f2fe', color: isDarkMode ? '#93c5fd' : '#0369a1', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Browse New File
                    </label>
                  </div>
                  {fileError && <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>{fileError}</p>}
                </div>

                {/* Divider / Choice Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', color: theme.titleSub, fontSize: '11px', fontWeight: '600', margin: '0' }}>
                  <div style={{ flex: 1, borderBottom: `1px solid ${theme.cardBorder}` }}></div>
                  <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or External Link URL</span>
                  <div style={{ flex: 1, borderBottom: `1px solid ${theme.cardBorder}` }}></div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.titleSub, marginBottom: '6px' }}>
                    External Web Link (URL)
                  </label>
                  <input 
                    type="url"
                    placeholder="https://example.com/guideline-doc"
                    value={externalUrl}
                    onChange={(e) => {
                      setExternalUrl(e.target.value);
                      if (e.target.value) setSelectedFile(null);
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: theme.inputBg, color: theme.inputColor }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button 
                    type="button"
                    onClick={() => setEditingDoc(null)}
                    style={{ padding: '9px 16px', background: theme.tabBgInactive, border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: theme.titleSub }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={updating}
                    style={{ padding: '9px 18px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', opacity: updating ? 0.7 : 1 }}
                  >
                    {updating ? 'Saving Changes...' : 'Save Updates'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: theme.modalBg, borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: `1px solid ${theme.modalBorder}`, boxSizing: 'border-box', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: isDarkMode ? '#450a0a' : '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: theme.titleMain }}>
              Delete Guideline?
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: theme.titleSub, lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: theme.titleMain }}>"{deletingDoc.title}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                style={{ padding: '9px 16px', background: theme.tabBgInactive, border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: theme.titleSub, flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                style={{ padding: '9px 16px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', flex: 1, opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}