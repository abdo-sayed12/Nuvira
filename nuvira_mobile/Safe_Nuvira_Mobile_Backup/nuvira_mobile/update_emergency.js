
const fs = require('fs');

let content = fs.readFileSync('lib/theme/app_translations.dart', 'utf8');

const arStr1 = '?? ?? ???? ??? ???? ????? - ???? ???? ??????? ?????? ?? ???? ????? ??????? ????. ?? ??? ??????? ????? ??? ???? ??????? ?? ??????? ??????.';
const enStr1 = '?? This may be an emergency - Contact your local emergency number or seek emergency care now. Do not drive yourself if you feel faint or severely unwell.';
const arStr2 = '???? ?????? ???????';
const enStr2 = 'Call emergency services';

content = content.replace(/      'emergency': '?????',/, \      'emergency': '?????',
      'emergency_warning': '\',
      'call_emergency_services': '\',\);

content = content.replace(/      'emergency': 'Emergency',/g, \      'emergency': 'Emergency',
      'emergency_warning': '\',
      'call_emergency_services': '\',\);

content = content.replace(/      'emergency': 'Urgence',/g, \      'emergency': 'Urgence',
      'emergency_warning': '\',
      'call_emergency_services': '\',\);

content = content.replace(/      'emergency': 'Notfall',/g, \      'emergency': 'Notfall',
      'emergency_warning': '\',
      'call_emergency_services': '\',\);

content = content.replace(/      'emergency': 'Emergencia',/g, \      'emergency': 'Emergencia',
      'emergency_warning': '\',
      'call_emergency_services': '\',\);

content = content.replace(/      'emergency': 'Emergenza',/g, \      'emergency': 'Emergenza',
      'emergency_warning': '\',
      'call_emergency_services': '\',\);

content = content.replace(/      'emergency': '?????????? ??????',/g, \      'emergency': '?????????? ??????',
      'emergency_warning': '\',
      'call_emergency_services': '\',\);

content = content.replace(/      'emergency': '????',/g, \      'emergency': '????',
      'emergency_warning': '\',
      'call_emergency_services': '\',\);

content = content.replace(/      'emergency': '??',/g, \      'emergency': '??',
      'emergency_warning': '\',
      'call_emergency_services': '\',\);

content = content.replace(/      'emergency': '??',/g, \      'emergency': '??',
      'emergency_warning': '\',
      'call_emergency_services': '\',\);

content = content.replace(/      'emergency': 'Acil Durum',/g, \      'emergency': 'Acil Durum',
      'emergency_warning': '\',
      'call_emergency_services': '\',\);

fs.writeFileSync('lib/theme/app_translations.dart', content);
console.log('updated');

