import sys
from pathlib import Path
import pytest
from services.stutter_analysis import stutter_analyzer

def test_hyphenated_stutter_detection():
    """Test detection of hyphenated stutters"""
    text = "I-I-I was thinking about it. He w-w-wanted to go."
    result = stutter_analyzer.analyze_text(text)
    
    assert result['total_count'] == 2
    assert len(result['hyphenated_stutters']) == 2
    
    # Check first stutter (I-I-I)
    stutter1 = result['hyphenated_stutters'][0]
    assert stutter1['base_word'] == 'i'
    assert stutter1['count'] == 3
    assert stutter1['text'] == 'I-I-I'
    
    # Check second stutter (w-w-wanted)
    stutter2 = result['hyphenated_stutters'][1]
    assert stutter2['base_word'] == 'w'
    assert stutter2['count'] == 3
    assert stutter2['text'] == 'w-w-wanted'

def test_word_stutter_detection():
    """Test detection of word-based stutters"""
    text = "I I I was nervous. He was very very, very excited."
    result = stutter_analyzer.analyze_text(text)
    
    assert result['total_count'] == 2
    assert len(result['word_stutters']) == 2
    
    # Check first stutter (I I I)
    stutter1 = result['word_stutters'][0]
    assert stutter1['base_word'] == 'i'
    assert stutter1['count'] == 3
    
    # Check second stutter (very very very)
    stutter2 = result['word_stutters'][1]
    assert stutter2['base_word'] == 'very'
    assert stutter2['count'] == 3

def test_mixed_stutter_types():
    """Test detection of both hyphenated and word-based stutters"""
    text = "I-I-I was nervous and he he he laughed."
    result = stutter_analyzer.analyze_text(text)
    
    assert result['total_count'] == 2
    assert len(result['hyphenated_stutters']) == 1
    assert len(result['word_stutters']) == 1
    
    # Check pattern counts
    assert 'i (x3)' in result['stutter_patterns']
    assert 'he (x3)' in result['stutter_patterns']

def test_context_capture():
    """Test that context is properly captured for stutters"""
    text = "The speaker said 'I-I-I need help' during the presentation."
    result = stutter_analyzer.analyze_text(text)
    
    assert len(result['hyphenated_stutters']) == 1
    stutter = result['hyphenated_stutters'][0]
    assert 'context' in stutter
    assert 'speaker' in stutter['context']
    assert 'need help' in stutter['context']

def test_ignore_common_words():
    """Test that common words are ignored"""
    text = "The the the and and and."
    result = stutter_analyzer.analyze_text(text)
    
    assert result['total_count'] == 0
    assert len(result['word_stutters']) == 0

def test_multiple_sentences():
    """Test stutter detection across multiple sentences"""
    text = "I-I-I was scared. Then he he he laughed. W-w-what happened next?"
    result = stutter_analyzer.analyze_text(text)
    
    assert result['total_count'] == 3
    assert len(result['hyphenated_stutters']) == 2  # I-I-I and W-w-what
    assert len(result['word_stutters']) == 1  # he he he

def test_case_insensitivity():
    """Test case-insensitive matching"""
    text = "Yes YES yes! W-w-WHAT what What?"
    result = stutter_analyzer.analyze_text(text)
    
    assert len(result['word_stutters']) == 1  # yes YES yes
    assert len(result['hyphenated_stutters']) == 1  # W-w-WHAT
    assert result['total_count'] == 2

def test_no_stutters():
    """Test text without stutters"""
    text = "This is a normal sentence without any stuttering."
    result = stutter_analyzer.analyze_text(text)
    
    assert result['total_count'] == 0
    assert len(result['hyphenated_stutters']) == 0
    assert len(result['word_stutters']) == 0
    assert len(result['stutter_patterns']) == 0

def test_error_handling():
    """Test error handling with invalid input"""
    with pytest.raises(Exception):
        stutter_analyzer.analyze_text(None)
    
    with pytest.raises(Exception):
        stutter_analyzer.analyze_text(123)  # type: ignore 