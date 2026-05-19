import React, { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  en: {
    // Sidebar nav
    securityScan: 'Security Scan',
    scanHistory: 'Scan History',
    transactions: 'Transactions',
    settings: 'Settings',
    // Scan page
    vulnerabilityAssessment: 'Vulnerability Assessment',
    scanSubtitle: 'Scan your domain for security vulnerabilities and threats',
    viewReports: 'View Reports',
    quickScan: 'Quick Scan',
    enterDomain: 'Enter domain name (e.g., example.com)',
    advancedOptions: 'Advanced Options',
    hideAdvancedOptions: 'Hide Advanced Options',
    sessionCookiePlaceholder: 'Session Cookie (Optional, e.g. PHPSESSID=123...)',
    quickScanTitle: 'Quick Scan',
    quickScanSubtitle: 'Scan the domain currently in the input box',
    quickScanBtn: 'Run Quick Scan',
    // Scan History
    securityArchives: 'Security Archives',
    archivesSubtitle: 'Review past scans and security analysis reports',
    totalScans: 'Total Scans',
    allScans: 'All Scans',
    completed: 'Completed',
    inProgress: 'In Progress',
    exportPDFReport: 'Export PDF Report',
    viewFullResults: 'View Full Results',
    downloadPDF: 'Download PDF',
    noScansFound: 'No scans found',
    startScanning: 'Start scanning domains to see your history here',
    // Settings
    profile: 'Profile',
    security: 'Security',
    notifications: 'Notifications',
    appearance: 'Appearance',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    autoSystem: 'Auto (System)',
    language: 'Language',
    saveAppearance: 'Save Appearance',
    // Plan banner
    activePlan: 'Active Plan',
    changePlan: 'Change Plan',
  },
  es: {
    securityScan: 'Escaneo de Seguridad',
    scanHistory: 'Historial de Escaneos',
    transactions: 'Transacciones',
    settings: 'Configuración',
    vulnerabilityAssessment: 'Evaluación de Vulnerabilidades',
    scanSubtitle: 'Escanee su dominio en busca de vulnerabilidades y amenazas',
    viewReports: 'Ver Informes',
    quickScan: 'Escaneo Rápido',
    enterDomain: 'Ingrese el nombre del dominio (ej: ejemplo.com)',
    advancedOptions: 'Opciones Avanzadas',
    hideAdvancedOptions: 'Ocultar Opciones Avanzadas',
    sessionCookiePlaceholder: 'Cookie de Sesión (Opcional, ej: PHPSESSID=123...)',
    quickScanTitle: 'Escaneo Rápido',
    quickScanSubtitle: 'Escanear el dominio en el cuadro de entrada',
    quickScanBtn: 'Ejecutar Escaneo Rápido',
    securityArchives: 'Archivos de Seguridad',
    archivesSubtitle: 'Revisar escaneos pasados e informes de análisis de seguridad',
    totalScans: 'Total de Escaneos',
    allScans: 'Todos los Escaneos',
    completed: 'Completado',
    inProgress: 'En Progreso',
    exportPDFReport: 'Exportar Informe PDF',
    viewFullResults: 'Ver Resultados Completos',
    downloadPDF: 'Descargar PDF',
    noScansFound: 'No se encontraron escaneos',
    startScanning: 'Comience a escanear dominios para ver su historial aquí',
    profile: 'Perfil',
    security: 'Seguridad',
    notifications: 'Notificaciones',
    appearance: 'Apariencia',
    theme: 'Tema',
    darkMode: 'Modo Oscuro',
    lightMode: 'Modo Claro',
    autoSystem: 'Auto (Sistema)',
    language: 'Idioma',
    saveAppearance: 'Guardar Apariencia',
    activePlan: 'Plan Activo',
    changePlan: 'Cambiar Plan',
  },
  fr: {
    securityScan: 'Scan de Sécurité',
    scanHistory: 'Historique des Scans',
    transactions: 'Transactions',
    settings: 'Paramètres',
    vulnerabilityAssessment: 'Évaluation des Vulnérabilités',
    scanSubtitle: 'Analysez votre domaine pour les vulnérabilités et menaces',
    viewReports: 'Voir les Rapports',
    quickScan: 'Scan Rapide',
    enterDomain: 'Entrez le nom de domaine (ex: exemple.com)',
    advancedOptions: 'Options Avancées',
    hideAdvancedOptions: 'Masquer les Options Avancées',
    sessionCookiePlaceholder: 'Cookie de Session (Optionnel, ex: PHPSESSID=123...)',
    quickScanTitle: 'Scan Rapide',
    quickScanSubtitle: 'Analyser le domaine dans la zone de saisie',
    quickScanBtn: 'Lancer le Scan Rapide',
    securityArchives: 'Archives de Sécurité',
    archivesSubtitle: 'Examiner les scans passés et les rapports d\'analyse',
    totalScans: 'Total des Scans',
    allScans: 'Tous les Scans',
    completed: 'Terminé',
    inProgress: 'En Cours',
    exportPDFReport: 'Exporter le Rapport PDF',
    viewFullResults: 'Voir les Résultats Complets',
    downloadPDF: 'Télécharger PDF',
    noScansFound: 'Aucun scan trouvé',
    startScanning: 'Commencez à scanner des domaines pour voir votre historique',
    profile: 'Profil',
    security: 'Sécurité',
    notifications: 'Notifications',
    appearance: 'Apparence',
    theme: 'Thème',
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair',
    autoSystem: 'Auto (Système)',
    language: 'Langue',
    saveAppearance: 'Enregistrer l\'Apparence',
    activePlan: 'Plan Actif',
    changePlan: 'Changer de Plan',
  },
  de: {
    securityScan: 'Sicherheitsscan',
    scanHistory: 'Scan-Verlauf',
    transactions: 'Transaktionen',
    settings: 'Einstellungen',
    vulnerabilityAssessment: 'Schwachstellenbewertung',
    scanSubtitle: 'Scannen Sie Ihre Domain nach Sicherheitslücken und Bedrohungen',
    viewReports: 'Berichte anzeigen',
    quickScan: 'Schnell-Scan',
    enterDomain: 'Domainnamen eingeben (z.B: beispiel.de)',
    advancedOptions: 'Erweiterte Optionen',
    hideAdvancedOptions: 'Erweiterte Optionen ausblenden',
    sessionCookiePlaceholder: 'Session-Cookie (Optional, z.B.: PHPSESSID=123...)',
    quickScanTitle: 'Schnell-Scan',
    quickScanSubtitle: 'Die Domain im Eingabefeld scannen',
    quickScanBtn: 'Schnell-Scan starten',
    securityArchives: 'Sicherheitsarchive',
    archivesSubtitle: 'Vergangene Scans und Sicherheitsanalyseberichte überprüfen',
    totalScans: 'Scans Gesamt',
    allScans: 'Alle Scans',
    completed: 'Abgeschlossen',
    inProgress: 'In Bearbeitung',
    exportPDFReport: 'PDF-Bericht exportieren',
    viewFullResults: 'Vollständige Ergebnisse anzeigen',
    downloadPDF: 'PDF herunterladen',
    noScansFound: 'Keine Scans gefunden',
    startScanning: 'Beginnen Sie mit dem Scannen von Domains, um Ihren Verlauf anzuzeigen',
    profile: 'Profil',
    security: 'Sicherheit',
    notifications: 'Benachrichtigungen',
    appearance: 'Erscheinungsbild',
    theme: 'Thema',
    darkMode: 'Dunkelmodus',
    lightMode: 'Hellmodus',
    autoSystem: 'Auto (System)',
    language: 'Sprache',
    saveAppearance: 'Erscheinungsbild speichern',
    activePlan: 'Aktiver Plan',
    changePlan: 'Plan ändern',
  }
}

const LanguageContext = createContext({
  language: 'en',
  t: (key) => key,
  setLanguage: () => {}
})

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() =>
    localStorage.getItem('zeron_language') || 'en'
  )

  const setLanguage = (lang) => {
    setLanguageState(lang)
    localStorage.setItem('zeron_language', lang)
  }

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
export default LanguageContext
