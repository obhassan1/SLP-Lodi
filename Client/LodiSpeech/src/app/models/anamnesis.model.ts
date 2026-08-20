export type YesNo = '' | 'yes' | 'no';

export interface AnamnesisReport {
  _id?: string;
  patient?: string;
  formDate: string;
  identifying: any;
  birthHistory: any;
  medicalHistory: any;
  developmentalHistory: any;
  speechLanguageHistory: any;
  socialInteraction: any;
  playSkills: any;
  educationHistory: any;
  additionalCommentsConcerns: string;
  createdBy?: any;
  updatedBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export function emptyAnamnesis(): AnamnesisReport {
  return {
    formDate: new Date().toISOString().slice(0, 10),
    identifying: {
      diagnosis: '', ageOfDiagnosis: '', motherName: '', motherOccupation: '',
      fatherName: '', fatherOccupation: '', childLivesWith: '', parentsStatus: '',
      siblings: [], otherLanguageAtHome: '', otherLanguage: '', interestsMotivators: ''
    },
    birthHistory: {
      unusualPregnancyBirth: '', unusualPregnancyBirthDetails: '',
      motherMedicationOrIllness: '', motherMedicationOrIllnessDetails: '', fullTerm: '',
      delivery: '', hospitalizedAfterBirth: '', hospitalizationDetails: '',
      medicalComplicationsAtBirth: '', otherPertinentInformation: ''
    },
    medicalHistory: {
      conditions: {
        adenoidectomy: false, breathingDifficultiesAsthma: false, chickenPox: false,
        earInfections: false, earInfectionsDetails: '', earTubes: false, earTubesDetails: '',
        headInjury: false, highFevers: false, meningitis: false, seizures: false,
        sleepingDifficulties: false, tonsillectomy: false, visionProblems: false
      },
      questionedHearing: '', questionedHearingDetails: '', hearingTested: '', hearingTestResults: '',
      questionedVision: '', questionedVisionDetails: '', visionTested: '', visionTestResults: '',
      injuriesSurgeries: '', medications: '', precautions: ''
    },
    developmentalHistory: {
      overallDevelopmentConcerns: '', overallDevelopmentConcernsDetails: '',
      milestones: { babbled: '', singleWords: '', combiningWords: '', walkedIndependently: '', ateTableFoods: '', toiletTrained: '' },
      chokeCoughEatingDrinking: '', difficultyChewingTextures: '', mouthsObjects: '', toothBrushing: '', pickyEater: ''
    },
    speechLanguageHistory: {
      speechLanguageProblem: '', speechLanguageProblemDetails: '', previousEvaluation: '', previousEvaluationDetails: '',
      childAbilities: {
        repeatsSoundsWordsPhrases: false, understandsWords: false, understandsSentences: false,
        understandsConversation: false, retrievesCommonObjects: false, respondsWhQuestions: false, asksQuestions: false
      },
      communicationMethods: { cryingTantrums: false, bodyLanguage: false, sounds: false, singleWords: false, twoToFourWordSentences: false },
      difficultToUnderstandByYou: '', difficultToUnderstandByOthers: '',
      speechSounds: { omitsSounds: false, distortsSounds: false, substitutesSounds: false },
      language: { wordOrder: false, omitsWords: false, speaksOnlyWordsPhrases: false },
      fluencyVoice: { wordSoundRepetitions: false, frequentLongPauses: false, frequentUmUh: false },
      extraInformation: ''
    },
    socialInteraction: { interactsWithChildren: '', childrenInteractionDetails: '', interactsWithAdults: '', adultsInteractionDetails: '' },
    playSkills: { preferredPlayCompany: '', gamesAndToys: '', screenTime: '' },
    educationHistory: { schoolAndGrade: '', strengthsBestSubjects: '', challengingSubjects: '', specializedServices: '', specializedServicesDetails: '' },
    additionalCommentsConcerns: ''
  };
}
