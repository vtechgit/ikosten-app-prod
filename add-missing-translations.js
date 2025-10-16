const fs = require('fs');
const path = require('path');

// Archivos de idiomas a actualizar
const languages = ['pt', 'it', 'de', 'ja', 'ko', 'ar'];

// Traducciones a agregar
const translations = {
  'pt': {
    'loadings.processing': 'Processando',
    'loadings.sending-subtitle': 'Por favor aguarde enquanto geramos o seu relatório'
  },
  'it': {
    'loadings.processing': 'Elaborazione',
    'loadings.sending-subtitle': 'Attendere mentre generiamo il rapporto'
  },
  'de': {
    'loadings.processing': 'Verarbeitung',
    'loadings.sending-subtitle': 'Bitte warten Sie, während wir Ihren Bericht erstellen'
  },
  'ja': {
    'loadings.processing': '処理中',
    'loadings.sending-subtitle': 'レポートを生成しています、お待ちください'
  },
  'ko': {
    'loadings.processing': '처리 중',
    'loadings.sending-subtitle': '보고서를 생성하는 동안 기다려 주세요'
  },
  'ar': {
    'loadings.processing': 'جارٍ المعالجة',
    'loadings.sending-subtitle': 'يرجى الانتظار بينما نقوم بإنشاء التقرير الخاص بك'
  }
};

// Procesar cada archivo
languages.forEach(lang => {
  const filePath = path.join(__dirname, 'i18n', `${lang}.json`);
  
  try {
    // Leer el archivo JSON
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    
    // Agregar las traducciones faltantes
    json['loadings.processing'] = translations[lang]['loadings.processing'];
    json['loadings.sending-subtitle'] = translations[lang]['loadings.sending-subtitle'];
    
    // Escribir el archivo con formato
    fs.writeFileSync(filePath, JSON.stringify(json, null, '\t'), 'utf8');
    
    console.log(`✅ ${lang}.json updated successfully`);
  } catch (error) {
    console.error(`❌ Error updating ${lang}.json:`, error.message);
  }
});

console.log('\n🎉 All translation files updated!');
