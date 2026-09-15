import os
import pytest
from app.services.ai_extractor import (
    DocumentExtractionResult, MessageExtractionResult, 
    MockDocumentExtractor, MockMessageExtractor,
    get_document_extractor, get_message_extractor
)
from pydantic import ValidationError

def test_document_validation_success():
    res = DocumentExtractionResult(merchant="Store", amount=100.0, confidence=0.9, currency="USD")
    assert not res.requires_review
    assert len(res.warnings) == 0

def test_document_validation_negative_amount():
    res = DocumentExtractionResult(merchant="Store", amount=-50.0, confidence=0.9)
    assert res.requires_review
    assert "Amount must be positive." in res.warnings

def test_document_validation_low_confidence():
    res = DocumentExtractionResult(merchant="Store", amount=100.0, confidence=0.5)
    assert res.requires_review
    assert "Low overall confidence. Please review carefully." in res.warnings

def test_message_validation_success():
    res = MessageExtractionResult(event_type="salary", amount=5000.0, confidence=0.9)
    assert not res.requires_review

def test_message_validation_invalid_type():
    res = MessageExtractionResult(event_type="invalid_type", amount=5000.0, confidence=0.9)
    assert res.requires_review
    assert "Invalid event type: invalid_type" in res.warnings

def test_message_validation_negative_amount():
    res = MessageExtractionResult(event_type="salary", amount=-5000.0, confidence=0.9)
    assert res.requires_review
    assert "Amount cannot be negative." in res.warnings

def test_mock_document_extractor():
    ext = MockDocumentExtractor()
    res = ext.extract_from_image(b"fake", "image/png")
    assert res.merchant == "Mocked Merchant Electronics"
    assert res.amount == 24999.0
    assert not res.requires_review

def test_mock_message_extractor():
    ext = MockMessageExtractor()
    res = ext.extract_from_text("My salary is 55000")
    assert res.event_type == "salary_change"
    assert res.amount == 55000.0
    assert not res.requires_review
    
    res_fail = ext.extract_from_text("Random gibberish")
    assert res_fail.event_type == "unknown"
    assert res_fail.requires_review

def test_provider_fallback():
    os.environ.pop("OPENAI_API_KEY", None)
    ext = get_document_extractor()
    assert isinstance(ext, MockDocumentExtractor)
