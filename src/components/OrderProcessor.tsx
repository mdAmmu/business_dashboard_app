import React, { useState, useRef } from 'react';
import { Upload, Mic, MicOff, Send, FileAudio, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ExtractedProduct {
  name: string;
  quantity: number;
}

interface Bill {
  id: string;
  customerName: string;
  transcription: string;
  extractedProducts: ExtractedProduct[];
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
    total: number;
  }>;
  unavailableItems: Array<{
    name: string;
    quantity: number;
    reason: string;
  }>;
  totalAmount: number;
  createdAt: string;
}

const OrderProcessor: React.FC = () => {
  const [customerName, setCustomerName] = useState('');
  const [textOrder, setTextOrder] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    billId: string;
    transcription: string;
    extractedProducts: ExtractedProduct[];
    bill: Bill;
  } | null>(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/wav' });
        const file = new File([blob], 'recording.wav', { type: 'audio/wav' });
        setAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const processOrder = async () => {
    if (!customerName.trim()) {
      setError('Please enter customer name');
      return;
    }

    if (!audioFile && !textOrder.trim()) {
      setError('Please provide either an audio file or text order');
      return;
    }

    setProcessing(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('customerName', customerName);
      
      if (audioFile) {
        formData.append('audio', audioFile);
      } else {
        formData.append('text', textOrder);
      }

      const response = await fetch('http://localhost:3001/api/process-order', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process order');
      }

      const data = await response.json();
      setResult(data);
      
      // Reset form
      setAudioFile(null);
      setTextOrder('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing order:', error);
      setError('Failed to process order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="mb-2">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Process Voice Orders</h2>
        <p className="text-xs md:text-sm text-gray-600">Upload audio or record voice orders to generate bills</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 flex-1 min-h-0">
        {/* Order Input Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 md:p-4 overflow-y-auto">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">New Order</h3>

          <div className="space-y-3">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                placeholder="Enter customer name"
              />
            </div>

            {/* Audio Input Options */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Order Input</h4>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Upload Audio File
                    </button>
                    <p className="text-xs text-gray-500">MP3, WAV, M4A up to 10MB</p>
                  </div>
                </div>
                {audioFile && (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg mt-2">
                    <FileAudio className="w-3 h-3" />
                    {audioFile.name}
                  </div>
                )}
              </div>

              {/* Voice Recording */}
              <div className="flex items-center gap-3">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isRecording ? 'Stop' : 'Record'}
                </button>
                {isRecording && (
                  <div className="flex items-center gap-2 text-red-500">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">Recording...</span>
                  </div>
                )}
              </div>

              {/* Text Alternative */}
              <div className="border-t pt-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Or Enter Text Order</label>
                <textarea
                  value={textOrder}
                  onChange={(e) => setTextOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  rows={2}
                  placeholder="e.g., 2 apples, 1 liter of milk, 3 bananas"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={processOrder}
              disabled={processing}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
            >
              {processing ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Process Order
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Order Results</h3>
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span>Order processed successfully!</span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Transcription</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{result.transcription}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Products</h4>
                  <div className="space-y-2">
                    {result.extractedProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="text-sm text-gray-600">{product.name}</span>
                        <span className="text-sm font-medium text-gray-900">{product.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Bill Details</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bill ID:</span>
                      <span className="font-medium text-gray-900">{result.billId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium text-gray-900">${result.bill.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderProcessor;