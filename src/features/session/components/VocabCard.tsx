import type { VocabWord, VerbForms, GenderForms } from '$types/curriculum'

function VerbFormsTable({ forms }: { forms: VerbForms }) {
  const rows: [string, string][] = [
    ['je', forms.je],
    ['tu', forms.tu],
    ['il / elle / on', forms.il],
    ['nous', forms.nous],
    ['vous', forms.vous],
    ['ils / elles', forms.ils],
  ]
  return (
    <table>
      <tbody>
        {rows.map(([pronoun, conjugated]) => (
          <tr key={pronoun}>
            <td>{pronoun}</td>
            <td>{conjugated}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function GenderFormsTable({ forms }: { forms: GenderForms }) {
  const rows: [string, string][] = [
    ['masculine', forms.masculine],
    ['feminine', forms.feminine],
    ['masculine plural', forms.masculinePlural],
    ['feminine plural', forms.femininePlural],
  ]
  return (
    <table>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td>{label}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function WordForms({ word }: { word: VocabWord }) {
  if (word.partOfSpeech === 'adverb' || word.partOfSpeech === 'expression') {
    return null
  }
  if (word.partOfSpeech === 'verb') {
    return <VerbFormsTable forms={word.forms as VerbForms} />
  }
  return <GenderFormsTable forms={word.forms as GenderForms} />
}

export default function VocabCard({ word }: { word: VocabWord }) {
  return (
    <div>
      <div>{word.word}</div>
      <div>{word.pronunciation}</div>
      <div>{word.meaning}</div>
      {word.notes && <div>{word.notes}</div>}
      <WordForms word={word} />
    </div>
  )
}
