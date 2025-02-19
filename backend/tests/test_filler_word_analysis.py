import sys
from pathlib import Path
import pytest
from services.filler_word_analysis import filler_word_analyzer

def test_basic_filler_detection():
    """Test basic detection of filler words"""
    text = "Um, I like, you know, wanted to um test this thing"
    result = filler_word_analyzer.analyze_text(text)
    
    assert result['total_count'] > 0
    assert 'um' in result['filler_words']
    assert 'like' in result['filler_words']
    assert 'you_know' in result['filler_words']
    assert result['filler_words']['um']['count'] == 2
    assert len(result['word_positions']) == 4  # um, like, you know, um

def test_context_capture():
    """Test that context is properly captured for filler words"""
    text = "I was thinking, um, about the project yesterday"
    result = filler_word_analyzer.analyze_text(text)
    
    assert len(result['word_positions']) == 1
    position = result['word_positions'][0]
    assert 'context' in position
    assert 'thinking' in position['context']
    assert 'project' in position['context']

def test_multiple_sentences():
    """Test filler word detection across multiple sentences"""
    text = "Well, I started the project. You know, it was like really hard. Actually, it worked out."
    result = filler_word_analyzer.analyze_text(text)
    
    assert result['total_count'] == 4  # well, you know, like, actually
    assert len(result['word_positions']) == 4
    assert result['word_positions'][0]['word'] == 'well'
    assert result['word_positions'][-1]['word'] == 'actually'

def test_no_filler_words():
    """Test text without filler words"""
    text = "The quick brown fox jumps over the lazy dog."
    result = filler_word_analyzer.analyze_text(text)
    
    assert result['total_count'] == 0
    assert len(result['filler_words']) == 0
    assert len(result['word_positions']) == 0

def test_repeated_fillers():
    """Test handling of repeated filler words"""
    text = "Um um um, I was like like totally like confused"
    result = filler_word_analyzer.analyze_text(text)
    
    assert result['filler_words']['um']['count'] == 3
    assert result['filler_words']['like']['count'] == 3
    assert len(result['word_positions']) == 6

def test_case_insensitivity():
    """Test case-insensitive matching"""
    text = "UM, I was Like, you KNOW, thinking"
    result = filler_word_analyzer.analyze_text(text)
    
    assert 'um' in result['filler_words']
    assert 'like' in result['filler_words']
    assert 'you_know' in result['filler_words']

def test_context_boundaries():
    """Test context extraction at text boundaries"""
    # Test at start of text
    text = "Um, starting here"
    result = filler_word_analyzer.analyze_text(text)
    assert len(result['word_positions']) == 1
    assert result['word_positions'][0]['context'] == text.strip()
    
    # Test at end of text
    text = "Ending with um"
    result = filler_word_analyzer.analyze_text(text)
    assert len(result['word_positions']) == 1
    assert result['word_positions'][0]['context'] == text.strip()

def test_valid_like_usage():
    """Test that valid uses of 'like' are not counted as filler words"""
    text = "I like to read. It looks like a book. I feel like dancing."
    result = filler_word_analyzer.analyze_text(text)
    
    # None of these should be counted as filler words
    assert 'like' not in result['filler_words']
    assert result['total_count'] == 0

def test_error_handling():
    """Test error handling with invalid input"""
    with pytest.raises(Exception):
        filler_word_analyzer.analyze_text(None)
    
    with pytest.raises(Exception):
        filler_word_analyzer.analyze_text(123)  # type: ignore 