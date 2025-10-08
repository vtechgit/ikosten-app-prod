const fs = require('fs');
const path = require('path');

// Traducciones para cada idioma
const translations = {
  'en.json': {
    "titles.modules.process.wizard.step1.question": "Which country are you traveling to?",
    "titles.modules.process.wizard.step1.subtitle": "Select the country where you'll be spending",
    "titles.modules.process.wizard.step2.question": "Upload your receipts",
    "titles.modules.process.wizard.step2.subtitle": "Take photos or upload PDF files of your expenses",
    "titles.modules.process.wizard.step2.selected-countries": "Selected countries",
    "titles.modules.process.wizard.step3.question": "Upload your bank statement",
    "titles.modules.process.wizard.step3.subtitle": "Upload your statement PDF file",
    "titles.modules.process.wizard.step4.question": "What currency is the bank statement in?",
    "titles.modules.process.wizard.step4.subtitle": "Select your statement's currency",
    "titles.modules.process.wizard.step5.question": "Confirm your name and email to send the result",
    "titles.modules.process.wizard.step5.subtitle": "Verify your contact information",
    "buttons.add-country": "Add Country"
  },
  'pt.json': {
    "titles.modules.process.wizard.step1.question": "Para qual país você está viajando?",
    "titles.modules.process.wizard.step1.subtitle": "Selecione o país onde você fará suas despesas",
    "titles.modules.process.wizard.step2.question": "Envie seus recibos",
    "titles.modules.process.wizard.step2.subtitle": "Tire fotos ou envie arquivos PDF de suas despesas",
    "titles.modules.process.wizard.step2.selected-countries": "Países selecionados",
    "titles.modules.process.wizard.step3.question": "Envie seu extrato bancário",
    "titles.modules.process.wizard.step3.subtitle": "Carregue o arquivo PDF do seu extrato",
    "titles.modules.process.wizard.step4.question": "Em que moeda está o extrato bancário?",
    "titles.modules.process.wizard.step4.subtitle": "Selecione a moeda do seu extrato",
    "titles.modules.process.wizard.step5.question": "Confirme seu nome e e-mail para enviar o resultado",
    "titles.modules.process.wizard.step5.subtitle": "Verifique suas informações de contato",
    "buttons.add-country": "Adicionar País"
  },
  'it.json': {
    "titles.modules.process.wizard.step1.question": "In quale paese stai viaggiando?",
    "titles.modules.process.wizard.step1.subtitle": "Seleziona il paese in cui effettuerai le tue spese",
    "titles.modules.process.wizard.step2.question": "Carica le tue ricevute",
    "titles.modules.process.wizard.step2.subtitle": "Scatta foto o carica file PDF delle tue spese",
    "titles.modules.process.wizard.step2.selected-countries": "Paesi selezionati",
    "titles.modules.process.wizard.step3.question": "Carica il tuo estratto conto",
    "titles.modules.process.wizard.step3.subtitle": "Carica il file PDF del tuo estratto",
    "titles.modules.process.wizard.step4.question": "In quale valuta è l'estratto conto?",
    "titles.modules.process.wizard.step4.subtitle": "Seleziona la valuta del tuo estratto",
    "titles.modules.process.wizard.step5.question": "Conferma il tuo nome ed email per inviare il risultato",
    "titles.modules.process.wizard.step5.subtitle": "Verifica le tue informazioni di contatto",
    "buttons.add-country": "Aggiungi Paese"
  },
  'de.json': {
    "titles.modules.process.wizard.step1.question": "In welches Land reisen Sie?",
    "titles.modules.process.wizard.step1.subtitle": "Wählen Sie das Land aus, in dem Sie Ihre Ausgaben tätigen werden",
    "titles.modules.process.wizard.step2.question": "Laden Sie Ihre Quittungen hoch",
    "titles.modules.process.wizard.step2.subtitle": "Machen Sie Fotos oder laden Sie PDF-Dateien Ihrer Ausgaben hoch",
    "titles.modules.process.wizard.step2.selected-countries": "Ausgewählte Länder",
    "titles.modules.process.wizard.step3.question": "Laden Sie Ihren Kontoauszug hoch",
    "titles.modules.process.wizard.step3.subtitle": "Laden Sie die PDF-Datei Ihres Kontoauszugs hoch",
    "titles.modules.process.wizard.step4.question": "In welcher Währung ist der Kontoauszug?",
    "titles.modules.process.wizard.step4.subtitle": "Wählen Sie die Währung Ihres Kontoauszugs",
    "titles.modules.process.wizard.step5.question": "Bestätigen Sie Ihren Namen und E-Mail zum Senden des Ergebnisses",
    "titles.modules.process.wizard.step5.subtitle": "Überprüfen Sie Ihre Kontaktinformationen",
    "buttons.add-country": "Land Hinzufügen"
  },
  'ja.json': {
    "titles.modules.process.wizard.step1.question": "どの国に旅行しますか？",
    "titles.modules.process.wizard.step1.subtitle": "支出を行う国を選択してください",
    "titles.modules.process.wizard.step2.question": "領収書をアップロード",
    "titles.modules.process.wizard.step2.subtitle": "経費の写真を撮るかPDFファイルをアップロードしてください",
    "titles.modules.process.wizard.step2.selected-countries": "選択された国",
    "titles.modules.process.wizard.step3.question": "銀行明細書をアップロード",
    "titles.modules.process.wizard.step3.subtitle": "明細書のPDFファイルをアップロードしてください",
    "titles.modules.process.wizard.step4.question": "銀行明細書の通貨は何ですか？",
    "titles.modules.process.wizard.step4.subtitle": "明細書の通貨を選択してください",
    "titles.modules.process.wizard.step5.question": "結果を送信するための名前とメールを確認",
    "titles.modules.process.wizard.step5.subtitle": "連絡先情報を確認してください",
    "buttons.add-country": "国を追加"
  },
  'ko.json': {
    "titles.modules.process.wizard.step1.question": "어느 나라로 여행하시나요?",
    "titles.modules.process.wizard.step1.subtitle": "지출할 국가를 선택하세요",
    "titles.modules.process.wizard.step2.question": "영수증 업로드",
    "titles.modules.process.wizard.step2.subtitle": "경비 사진을 찍거나 PDF 파일을 업로드하세요",
    "titles.modules.process.wizard.step2.selected-countries": "선택된 국가",
    "titles.modules.process.wizard.step3.question": "은행 명세서 업로드",
    "titles.modules.process.wizard.step3.subtitle": "명세서 PDF 파일을 업로드하세요",
    "titles.modules.process.wizard.step4.question": "은행 명세서의 통화는 무엇인가요?",
    "titles.modules.process.wizard.step4.subtitle": "명세서의 통화를 선택하세요",
    "titles.modules.process.wizard.step5.question": "결과를 보내기 위한 이름과 이메일 확인",
    "titles.modules.process.wizard.step5.subtitle": "연락처 정보를 확인하세요",
    "buttons.add-country": "국가 추가"
  },
  'ar.json': {
    "titles.modules.process.wizard.step1.question": "إلى أي بلد تسافر؟",
    "titles.modules.process.wizard.step1.subtitle": "حدد البلد الذي ستقوم فيه بنفقاتك",
    "titles.modules.process.wizard.step2.question": "قم بتحميل إيصالاتك",
    "titles.modules.process.wizard.step2.subtitle": "التقط صورًا أو قم بتحميل ملفات PDF لنفقاتك",
    "titles.modules.process.wizard.step2.selected-countries": "البلدان المحددة",
    "titles.modules.process.wizard.step3.question": "قم بتحميل كشف حسابك المصرفي",
    "titles.modules.process.wizard.step3.subtitle": "قم بتحميل ملف PDF لكشف حسابك",
    "titles.modules.process.wizard.step4.question": "ما هي عملة كشف الحساب المصرفي؟",
    "titles.modules.process.wizard.step4.subtitle": "حدد عملة كشف حسابك",
    "titles.modules.process.wizard.step5.question": "أكد اسمك وبريدك الإلكتروني لإرسال النتيجة",
    "titles.modules.process.wizard.step5.subtitle": "تحقق من معلومات الاتصال الخاصة بك",
    "buttons.add-country": "إضافة بلد"
  }
};

// Función para agregar traducciones a un archivo
function addTranslationsToFile(filename, newTranslations) {
  const filePath = path.join(__dirname, 'i18n', filename);
  
  try {
    // Leer el archivo JSON
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    
    // Agregar las nuevas traducciones
    Object.keys(newTranslations).forEach(key => {
      json[key] = newTranslations[key];
    });
    
    // Convertir de vuelta a JSON con formato de tabs
    const updatedContent = JSON.stringify(json, null, '\t');
    
    // Escribir el archivo
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`✅ ${filename} updated successfully`);
  } catch (error) {
    console.error(`❌ Error updating ${filename}:`, error.message);
  }
}

// Procesar todos los archivos
Object.keys(translations).forEach(filename => {
  addTranslationsToFile(filename, translations[filename]);
});

console.log('🎉 All translation files updated!');
