const mongoose = require('mongoose');

const yesNo = {
  type: String,
  enum: ['', 'yes', 'no'],
  default: ''
};

const siblingSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  age: { type: String, trim: true, default: '' },
  speechHearingProblems: { type: String, trim: true, default: '' }
}, { _id: false });

const anamnesisSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true,
    index: true
  },
  formDate: { type: Date, default: Date.now },

  identifying: {
    diagnosis: { type: String, trim: true, default: '' },
    ageOfDiagnosis: { type: String, trim: true, default: '' },
    motherName: { type: String, trim: true, default: '' },
    motherOccupation: { type: String, trim: true, default: '' },
    fatherName: { type: String, trim: true, default: '' },
    fatherOccupation: { type: String, trim: true, default: '' },
    childLivesWith: { type: String, trim: true, default: '' },
    parentsStatus: { type: String, trim: true, default: '' },
    siblings: { type: [siblingSchema], default: [] },
    otherLanguageAtHome: yesNo,
    otherLanguage: { type: String, trim: true, default: '' },
    interestsMotivators: { type: String, trim: true, default: '' }
  },

  birthHistory: {
    unusualPregnancyBirth: yesNo,
    unusualPregnancyBirthDetails: { type: String, trim: true, default: '' },
    motherMedicationOrIllness: yesNo,
    motherMedicationOrIllnessDetails: { type: String, trim: true, default: '' },
    fullTerm: yesNo,
    delivery: { type: String, trim: true, default: '' },
    hospitalizedAfterBirth: yesNo,
    hospitalizationDetails: { type: String, trim: true, default: '' },
    medicalComplicationsAtBirth: yesNo,
    otherPertinentInformation: { type: String, trim: true, default: '' }
  },

  medicalHistory: {
    conditions: {
      adenoidectomy: { type: Boolean, default: false },
      breathingDifficultiesAsthma: { type: Boolean, default: false },
      chickenPox: { type: Boolean, default: false },
      earInfections: { type: Boolean, default: false },
      earInfectionsDetails: { type: String, trim: true, default: '' },
      earTubes: { type: Boolean, default: false },
      earTubesDetails: { type: String, trim: true, default: '' },
      headInjury: { type: Boolean, default: false },
      highFevers: { type: Boolean, default: false },
      meningitis: { type: Boolean, default: false },
      seizures: { type: Boolean, default: false },
      sleepingDifficulties: { type: Boolean, default: false },
      tonsillectomy: { type: Boolean, default: false },
      visionProblems: { type: Boolean, default: false }
    },
    questionedHearing: yesNo,
    questionedHearingDetails: { type: String, trim: true, default: '' },
    hearingTested: yesNo,
    hearingTestResults: { type: String, trim: true, default: '' },
    questionedVision: yesNo,
    questionedVisionDetails: { type: String, trim: true, default: '' },
    visionTested: yesNo,
    visionTestResults: { type: String, trim: true, default: '' },
    injuriesSurgeries: { type: String, trim: true, default: '' },
    medications: { type: String, trim: true, default: '' },
    precautions: { type: String, trim: true, default: '' }
  },

  developmentalHistory: {
    overallDevelopmentConcerns: yesNo,
    overallDevelopmentConcernsDetails: { type: String, trim: true, default: '' },
    milestones: {
      babbled: { type: String, trim: true, default: '' },
      singleWords: { type: String, trim: true, default: '' },
      combiningWords: { type: String, trim: true, default: '' },
      walkedIndependently: { type: String, trim: true, default: '' },
      ateTableFoods: { type: String, trim: true, default: '' },
      toiletTrained: { type: String, trim: true, default: '' }
    },
    chokeCoughEatingDrinking: yesNo,
    difficultyChewingTextures: yesNo,
    mouthsObjects: yesNo,
    toothBrushing: yesNo,
    pickyEater: yesNo
  },

  speechLanguageHistory: {
    speechLanguageProblem: yesNo,
    speechLanguageProblemDetails: { type: String, trim: true, default: '' },
    previousEvaluation: yesNo,
    previousEvaluationDetails: { type: String, trim: true, default: '' },
    childAbilities: {
      repeatsSoundsWordsPhrases: { type: Boolean, default: false },
      understandsWords: { type: Boolean, default: false },
      understandsSentences: { type: Boolean, default: false },
      understandsConversation: { type: Boolean, default: false },
      retrievesCommonObjects: { type: Boolean, default: false },
      respondsWhQuestions: { type: Boolean, default: false },
      asksQuestions: { type: Boolean, default: false }
    },
    communicationMethods: {
      cryingTantrums: { type: Boolean, default: false },
      bodyLanguage: { type: Boolean, default: false },
      sounds: { type: Boolean, default: false },
      singleWords: { type: Boolean, default: false },
      twoToFourWordSentences: { type: Boolean, default: false }
    },
    difficultToUnderstandByYou: yesNo,
    difficultToUnderstandByOthers: yesNo,
    speechSounds: {
      omitsSounds: { type: Boolean, default: false },
      distortsSounds: { type: Boolean, default: false },
      substitutesSounds: { type: Boolean, default: false }
    },
    language: {
      wordOrder: { type: Boolean, default: false },
      omitsWords: { type: Boolean, default: false },
      speaksOnlyWordsPhrases: { type: Boolean, default: false }
    },
    fluencyVoice: {
      wordSoundRepetitions: { type: Boolean, default: false },
      frequentLongPauses: { type: Boolean, default: false },
      frequentUmUh: { type: Boolean, default: false }
    },
    extraInformation: { type: String, trim: true, default: '' }
  },

  socialInteraction: {
    interactsWithChildren: yesNo,
    childrenInteractionDetails: { type: String, trim: true, default: '' },
    interactsWithAdults: yesNo,
    adultsInteractionDetails: { type: String, trim: true, default: '' }
  },

  playSkills: {
    preferredPlayCompany: { type: String, trim: true, default: '' },
    gamesAndToys: { type: String, trim: true, default: '' },
    screenTime: { type: String, trim: true, default: '' }
  },

  educationHistory: {
    schoolAndGrade: { type: String, trim: true, default: '' },
    strengthsBestSubjects: { type: String, trim: true, default: '' },
    challengingSubjects: { type: String, trim: true, default: '' },
    specializedServices: yesNo,
    specializedServicesDetails: { type: String, trim: true, default: '' }
  },

  additionalCommentsConcerns: { type: String, trim: true, default: '' },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Anamnesis', anamnesisSchema);
