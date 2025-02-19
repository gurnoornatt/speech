import spacy
import re
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)

class StutterAnalyzer:
    def __init__(self):
        """Initialize the stutter analyzer with spaCy model and patterns"""
        # Load the English language model
        self.nlp = spacy.load("en_core_web_sm")
        
        # Regex pattern for hyphenated stutters (e.g., "I-I-I")
        self.exact_hyphen_pattern = re.compile(r'\b(\w+)(?:-\1)+\b', re.IGNORECASE)
        self.partial_hyphen_pattern = re.compile(r'\b(\w+)-(?:\w+)(?:-(?:\w+))*\b', re.IGNORECASE)
        
        # Regex pattern for word-based stutters with optional punctuation
        self.word_pattern = re.compile(r'\b(\w+)(?:[,\s.]+(?i:\1)){2,}\b', re.IGNORECASE)
        
        # Pattern for counting hyphenated stutters
        self.hyphen_count_pattern = re.compile(r'\b\w+(?:-\w+)*\b', re.IGNORECASE)
        
        # Common words to ignore (articles, prepositions, etc.)
        self.ignore_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by'
        }

    def analyze_text(self, text: str) -> Dict:
        """
        Analyze text for stutters and their positions
        
        Args:
            text (str): Input text to analyze
            
        Returns:
            Dict: Dictionary containing stutter information
        """
        try:
            # Process the text with spaCy
            doc = self.nlp(text)
            
            # Initialize results
            results = {
                'total_count': 0,
                'hyphenated_stutters': [],  # For stutters like "I-I-I"
                'word_stutters': [],        # For stutters like "I I I"
                'stutter_patterns': {}      # Count of each stutter pattern
            }
            
            # Track processed spans to avoid duplicates
            processed_spans = set()
            
            # Process text sentence by sentence
            sentences = list(doc.sents)
            
            # First pass: Find all stutters
            all_stutters = []
            
            for sent in sentences:
                sent_text = sent.text
                sent_start = sent.start_char
                
                # Find exact hyphenated stutters (I-I-I)
                for match in self.exact_hyphen_pattern.finditer(sent_text):
                    start, end = match.span()
                    absolute_start = sent_start + start
                    absolute_end = sent_start + end
                    
                    # Get the base word and full stutter
                    base_word = match.group(1).lower()
                    if base_word in self.ignore_words:
                        continue
                        
                    full_stutter = match.group(0)
                    stutter_count = full_stutter.count('-') + 1
                    
                    # Get context
                    context_start = max(0, start - 30)
                    context_end = min(len(sent_text), end + 30)
                    context = sent_text[context_start:context_end].strip()
                    
                    all_stutters.append({
                        'type': 'hyphenated',
                        'text': full_stutter,
                        'base_word': base_word,
                        'count': stutter_count,
                        'start': absolute_start,
                        'end': absolute_end,
                        'context': context
                    })
                
                # Find partial hyphenated stutters (w-w-wanted)
                for match in self.partial_hyphen_pattern.finditer(sent_text):
                    start, end = match.span()
                    absolute_start = sent_start + start
                    absolute_end = sent_start + end
                    
                    # Get the base word and full stutter
                    base_word = match.group(1).lower()
                    if base_word in self.ignore_words:
                        continue
                        
                    full_stutter = match.group(0)
                    # Force count to 3 for partial hyphenated stutters
                    stutter_count = 3
                    
                    # Get context
                    context_start = max(0, start - 30)
                    context_end = min(len(sent_text), end + 30)
                    context = sent_text[context_start:context_end].strip()
                    
                    all_stutters.append({
                        'type': 'hyphenated',
                        'text': full_stutter,
                        'base_word': base_word,
                        'count': stutter_count,
                        'start': absolute_start,
                        'end': absolute_end,
                        'context': context
                    })
                
                # Find word-based stutters using spaCy tokens
                i = 0
                while i < len(sent):
                    token = sent[i]
                    if token.text.lower() in self.ignore_words:
                        i += 1
                        continue
                    
                    # Look ahead for repeated words
                    j = i + 1
                    repeat_count = 1
                    repeat_tokens = [token]
                    last_was_punctuation = False
                    
                    # Collect all consecutive repeated tokens
                    while j < len(sent):
                        next_token = sent[j]
                        # Check if it's punctuation
                        if next_token.text in {',', '.', '...', '?', '!'}:
                            last_was_punctuation = True
                            j += 1
                            continue
                        # Skip other punctuation and whitespace
                        if next_token.is_punct or next_token.is_space:
                            j += 1
                            continue
                        # If it's not a match, break
                        if next_token.text.lower() != token.text.lower():
                            break
                        repeat_tokens.append(next_token)
                        repeat_count += 1
                        last_was_punctuation = False
                        j += 1
                    
                    # If we found a stutter (3 or more repetitions, or 2 with clear pause)
                    if repeat_count >= 3 or (repeat_count == 2 and last_was_punctuation):
                        start = token.idx
                        end = repeat_tokens[-1].idx + len(repeat_tokens[-1].text)
                        absolute_start = sent_start + start
                        absolute_end = sent_start + end
                        
                        # Get context
                        context_start = max(0, start - 30)
                        context_end = min(len(sent_text), end + 30)
                        context = sent_text[context_start:context_end].strip()
                        
                        all_stutters.append({
                            'type': 'word',
                            'text': sent_text[start:end],
                            'base_word': token.text.lower(),
                            'count': repeat_count,
                            'start': absolute_start,
                            'end': absolute_end,
                            'context': context
                        })
                    
                    i = j
            
            # Sort all stutters by position and remove overlaps
            all_stutters.sort(key=lambda x: (x['start'], x['base_word']))
            
            # Remove overlapping stutters, preferring longer stutters
            non_overlapping = []
            i = 0
            
            while i < len(all_stutters):
                current = all_stutters[i]
                j = i + 1
                best_stutter = current
                
                # Look ahead for overlapping stutters
                while j < len(all_stutters) and all_stutters[j]['start'] < current['end']:
                    if all_stutters[j]['count'] > best_stutter['count']:
                        best_stutter = all_stutters[j]
                    j += 1
                
                non_overlapping.append(best_stutter)
                i = j if j > i + 1 else i + 1
            
            # Sort non-overlapping stutters by position and base word
            non_overlapping.sort(key=lambda x: (x['start'], x['base_word']))
            
            # Separate stutters by type
            results['hyphenated_stutters'] = [s for s in non_overlapping if s['type'] == 'hyphenated']
            results['word_stutters'] = [s for s in non_overlapping if s['type'] == 'word']
            
            # Update pattern counts and total count
            results['stutter_patterns'] = {}
            results['total_count'] = len(non_overlapping)
            
            for stutter in non_overlapping:
                pattern = f"{stutter['base_word']} (x{stutter['count']})"
                results['stutter_patterns'][pattern] = results['stutter_patterns'].get(pattern, 0) + 1
            
            return results
            
        except Exception as e:
            logger.error(f"Error analyzing text for stutters: {e}")
            raise

# Create a global instance
stutter_analyzer = StutterAnalyzer() 