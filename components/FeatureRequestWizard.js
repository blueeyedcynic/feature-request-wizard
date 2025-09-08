import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, User, MessageSquare, Target, Search, FileText } from 'lucide-react';

const FeatureRequestWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    companyWebsite: '',
    jobDescription: '',
    problem: '',
    opportunity: '',
    dynamicQuestions: [],
    dynamicAnswers: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const totalSteps = 5;

  const steps = [
    { number: 1, title: 'Who You Are', icon: User },
    { number: 2, title: 'The Problem', icon: MessageSquare },
    { number: 3, title: 'The Opportunity', icon: Target },
    { number: 4, title: 'Deep Dive', icon: Search },
    { number: 5, title: 'Review', icon: FileText }
  ];

  const validateStep = (step) => {
    const newErrors = {};
    
    switch(step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.company.trim()) newErrors.company = 'Company is required';
        if (!formData.jobDescription.trim()) newErrors.jobDescription = 'Job description is required';
        break;
      case 2:
        if (!formData.problem.trim()) newErrors.problem = 'Problem description is required';
        break;
      case 3:
        if (!formData.opportunity.trim()) newErrors.opportunity = 'Opportunity description is required';
        break;
      case 4:
        formData.dynamicQuestions.forEach((_, index) => {
          if (!formData.dynamicAnswers[index]?.trim()) {
            newErrors[`dynamic_${index}`] = 'This answer is required';
          }
        });
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateDynamicQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          company: formData.company,
          jobDescription: formData.jobDescription,
          problem: formData.problem,
          opportunity: formData.opportunity
        }),
      });

      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        dynamicQuestions: data.questions || []
      }));
      
      setCurrentStep(4);
    } catch (error) {
      console.error('Error generating questions:', error);
      setFormData(prev => ({
        ...prev,
        dynamicQuestions: [
          "How many people or processes would be impacted by solving this problem?",
          "What's the estimated time or cost savings this solution could provide monthly?"
        ]
      }));
      
      setCurrentStep(4);
    }
    setIsGeneratingQuestions(false);
  };

  const submitToGoogleSheets = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/submit-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (response.ok) {
        setShowSuccessModal(true);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Error submitting feature request. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    
    setFormData({
      name: '',
      email: '',
      company: '',
      companyWebsite: '',
      jobDescription: '',
      problem: '',
      opportunity: '',
      dynamicQuestions: [],
      dynamicAnswers: {}
    });
    setCurrentStep(1);
  };

  const nextStep = async () => {
    if (!validateStep(currentStep)) return;
    
    if (currentStep === 3) {
      await generateDynamicQuestions();
      return;
    }
    
    if (currentStep === 5) {
      await submitToGoogleSheets();
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateDynamicAnswer = (index, value) => {
    setFormData(prev => ({
      ...prev,
      dynamicAnswers: { ...prev.dynamicAnswers, [index]: value }
    }));
    if (errors[`dynamic_${index}`]) {
      setErrors(prev => ({ ...prev, [`dynamic_${index}`]: '' }));
    }
  };

  const renderProgressBar = () => (
    <div className="mb-6 sm:mb-8">
      <div className="hidden sm:flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          
          return (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isCompleted ? 'bg-green-600 border-green-600' :
                isCurrent ? 'bg-blue-600 border-blue-600' :
                'bg-gray-700 border-gray-600'
              }`}>
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Icon className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-600'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="sm:hidden mb-4">
        <div className="flex items-center justify-center mb-3">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 bg-blue-600 border-blue-600`}>
            {React.createElement(steps[currentStep - 1].icon, { className: "w-6 h-6 text-white" })}
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div className="text-center">
        <span className="text-sm text-gray-400">
          Step {currentStep} of {totalSteps}: {steps[currentStep - 1].title}
        </span>
      </div>
    </div>
  );

  const renderSuccessModal = () => {
    if (!showSuccessModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-6 sm:p-8 max-w-md w-full mx-4 border border-gray-600">
          <div className="text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Thank you for your submission!</h3>
            <p className="text-gray-300 mb-6">
              Our product team will review this and reach out to you.
            </p>
            <button
              onClick={handleModalClose}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    if (isGeneratingQuestions) {
      return (
        <div className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Analyzing your responses...</h2>
          <div className="flex flex-col items-center justify-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-500 mb-6"></div>
            <p className="text-base sm:text-lg text-gray-300 mb-2 text-center px-4">Thinking about your answers and generating follow-ups...</p>
            <p className="text-sm text-gray-400 text-center">This will just take a moment</p>
          </div>
        </div>
      );
    }

    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Tell us about yourself</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className={`w-full p-3 bg-gray-700 border ${errors.name ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:border-blue-500 focus:outline-none text-base`}
                  placeholder="Your full name"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={`w-full p-3 bg-gray-700 border ${errors.email ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:border-blue-500 focus:outline-none text-base`}
                  placeholder="your.email@company.com"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => updateFormData('company', e.target.value)}
                  className={`w-full p-3 bg-gray-700 border ${errors.company ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:border-blue-500 focus:outline-none text-base`}
                  placeholder="Your company name"
                />
                {errors.company && <p className="text-red-400 text-sm mt-1">{errors.company}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Website</label>
                <input
                  type="url"
                  value={formData.companyWebsite || ''}
                  onChange={(e) => updateFormData('companyWebsite', e.target.value)}
                  className={`w-full p-3 bg-gray-700 border ${errors.companyWebsite ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:border-blue-500 focus:outline-none text-base`}
                  placeholder="https://yourcompany.com"
                />
                {errors.companyWebsite && <p className="text-red-400 text-sm mt-1">{errors.companyWebsite}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Job Description</label>
                <input
                  type="text"
                  value={formData.jobDescription}
                  onChange={(e) => updateFormData('jobDescription', e.target.value)}
                  className={`w-full p-3 bg-gray-700 border ${errors.jobDescription ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:border-blue-500 focus:outline-none text-base`}
                  placeholder="e.g., Product Manager, Software Engineer, Sales Director"
                />
                {errors.jobDescription && <p className="text-red-400 text-sm mt-1">{errors.jobDescription}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">What challenge or problem are you facing?</h2>
            <div>
              <textarea
                value={formData.problem}
                onChange={(e) => updateFormData('problem', e.target.value)}
                className={`w-full p-3 bg-gray-700 border ${errors.problem ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:border-blue-500 focus:outline-none h-32 sm:h-32 resize-none text-base`}
                placeholder="Describe the specific challenge or problem you're encountering. Be as detailed as possible about what's not working or what's causing friction..."
              />
              {errors.problem && <p className="text-red-400 text-sm mt-1">{errors.problem}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">What opportunity do you see?</h2>
            <div>
              <textarea
                value={formData.opportunity}
                onChange={(e) => updateFormData('opportunity', e.target.value)}
                className={`w-full p-3 bg-gray-700 border ${errors.opportunity ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:border-blue-500 focus:outline-none h-32 sm:h-32 resize-none text-base`}
                placeholder="What would be different if this challenge or problem went away? How would this impact your work, team, or business?"
              />
              {errors.opportunity && <p className="text-red-400 text-sm mt-1">{errors.opportunity}</p>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Let's dig deeper</h2>
            <p className="text-gray-300 mb-4 sm:mb-6">Based on your responses, we have some specific questions to better understand the impact:</p>
            
            {formData.dynamicQuestions.map((question, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {question}
                </label>
                <textarea
                  value={formData.dynamicAnswers[index] || ''}
                  onChange={(e) => updateDynamicAnswer(index, e.target.value)}
                  className={`w-full p-3 bg-gray-700 border ${errors[`dynamic_${index}`] ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:border-blue-500 focus:outline-none h-24 resize-none text-base`}
                  placeholder="Please provide as much detail as possible..."
                />
                {errors[`dynamic_${index}`] && <p className="text-red-400 text-sm mt-1">{errors[`dynamic_${index}`]}</p>}
              </div>
            ))}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Review your submission</h2>
            
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Contact Information</h3>
                <div className="text-sm sm:text-base text-gray-300 space-y-1">
                  <p>{formData.name} ({formData.email})</p>
                  <p>{formData.jobDescription} at {formData.company}</p>
                  {formData.companyWebsite && <p>Website: {formData.companyWebsite}</p>}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Problem</h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{formData.problem}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Opportunity</h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{formData.opportunity}</p>
              </div>
              
              {formData.dynamicQuestions.map((question, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-white mb-2">{question}</h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{formData.dynamicAnswers[index]}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {renderSuccessModal()}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Feature Request Wizard</h1>
            <p className="text-gray-400 text-sm sm:text-base px-4">Help us understand your needs and the business impact</p>
          </div>
          
          {renderProgressBar()}
          
          <div className="bg-gray-800 rounded-lg p-4 sm:p-8 mb-6 sm:mb-8">
            {renderStep()}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
            <button
              onClick={prevStep}
              disabled={currentStep === 1 || isGeneratingQuestions}
              className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium text-sm sm:text-base ${
                currentStep === 1 || isGeneratingQuestions
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </button>
            
            <button
              onClick={nextStep}
              disabled={isLoading || isGeneratingQuestions}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isGeneratingQuestions ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">Generating Questions...</span>
                  <span className="sm:hidden">Generating...</span>
                </>
              ) : isLoading && currentStep === totalSteps ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : currentStep === totalSteps ? 'Submit Request' : 'Next'}
              {currentStep !== totalSteps && !isGeneratingQuestions && !isLoading && <ChevronRight className="w-4 h-4 ml-2" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureRequestWizard;