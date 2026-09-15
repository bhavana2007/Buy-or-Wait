from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class ExtractedField(BaseModel):
    value: str
    confidence: float

class DocumentExtractionResult(BaseModel):
    merchant: Optional[ExtractedField]
    amount: Optional[ExtractedField]
    currency: Optional[ExtractedField]
    date: Optional[ExtractedField]
    invoice_number: Optional[ExtractedField]
    warnings: List[str] = []

class MessageExtractionResult(BaseModel):
    event_type: str
    amount: Optional[float]
    date: Optional[date]
    confidence: float
    warnings: List[str] = []

class BaseDocumentExtractor:
    def extract_from_image(self, image_path: str) -> DocumentExtractionResult:
        raise NotImplementedError

class BaseMessageExtractor:
    def extract_from_text(self, message: str) -> MessageExtractionResult:
        raise NotImplementedError

class MockDocumentExtractor(BaseDocumentExtractor):
    def extract_from_image(self, image_path: str) -> DocumentExtractionResult:
        # Fallback implementation
        return DocumentExtractionResult(
            merchant=ExtractedField(value="Mock Merchant", confidence=0.9),
            amount=ExtractedField(value="100.0", confidence=0.8),
            currency=ExtractedField(value="INR", confidence=0.99),
            date=ExtractedField(value="2026-09-15", confidence=0.95),
            invoice_number=None,
            warnings=["Using fallback mock extractor"]
        )

class MockMessageExtractor(BaseMessageExtractor):
    def extract_from_text(self, message: str) -> MessageExtractionResult:
        return MessageExtractionResult(
            event_type="salary_update",
            amount=55000.0,
            date=None,
            confidence=0.85,
            warnings=["Using fallback mock extractor"]
        )
