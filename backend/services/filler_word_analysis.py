import spacy
import re
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)

class FillerWordAnalyzer:
    def __init__(self):
        """Initialize the filler word analyzer with spaCy model and filler word patterns"""
        # Load the English language model
        self.nlp = spacy.load("en_core_web_sm")
        
        # Define common filler words and patterns
        self.filler_patterns = {
            'um': r'\b(um+|uhm+)\b',
            'uh': r'\b(uh+)\b',
            'you_know': r'\byou\s+know\b',
            'well': r'^\s*well\b|\b\s+well\b',
            'so': r'^\s*so\b|\b\s+so\b',
            'right': r'\bright\b(?!\s+now\b|\s+away\b|\s+here\b|\s+there\b)',
            'basically': r'\bbasically\b',
            'literally': r'\bliterally\b',
            'actually': r'\bactually\b'
        }
        
        # Valid verbs that can precede 'like'
        self.valid_like_verbs = {
            'like', 'likes', 'liked', 'liking',  # Direct 'like' verbs
            'feel', 'feels', 'felt', 'feeling',  # Feel like
            'look', 'looks', 'looked', 'looking',  # Look like
            'seem', 'seems', 'seemed', 'seeming'  # Seem like
        }
        
        # Valid words that can follow 'like'
        self.valid_like_followers = {
            'to', 'the', 'a', 'an', 'that', 'this', 'it', 'when', 'how'
        }
        
        # Compile regex patterns for efficiency
        self.compiled_patterns = {
            word: re.compile(pattern, re.IGNORECASE)
            for word, pattern in self.filler_patterns.items()
        }

    def _is_filler_like(self, token) -> bool:
        """
        Determine if a 'like' token is being used as a filler word
        
        Args:
            token: spaCy token to analyze
            
        Returns:
            bool: True if the token is being used as a filler word
        """
        if token.text.lower() != 'like':
            return False
            
        # Check previous token
        if token.i > 0:
            prev_token = token.doc[token.i - 1]
            prev_text = prev_token.text.lower()
            
            # Check if it's part of a valid verb phrase
            if prev_text in self.valid_like_verbs:
                return False
            
            # Check for modal verbs
            if prev_token.pos_ == 'VERB' and prev_text in {'would', 'could', 'should', 'might', 'may', 'will', 'can'}:
                return False
                
            # Check for subject + 'like' when it's clearly a verb
            if prev_token.pos_ in {'PRON', 'PROPN', 'NOUN'} and prev_token.dep_ == 'nsubj':
                # Look ahead to see if it's followed by an object
                if token.i < len(token.doc) - 1:
                    next_token = token.doc[token.i + 1]
                    if next_token.dep_ in {'dobj', 'pobj'}:
                        return False
        
        # Check next token
        if token.i < len(token.doc) - 1:
            next_token = token.doc[token.i + 1]
            next_text = next_token.text.lower()
            
            # Check for 'like to/the/a/an' constructions
            if next_text in self.valid_like_followers:
                return False
        
        return True

    def analyze_text(self, text: str) -> Dict:
        """
        Analyze text for filler words and their positions
        
        Args:
            text (str): Input text to analyze
            
        Returns:
            Dict: Dictionary containing filler word counts and positions
        """
        try:
            # Process the text with spaCy
            doc = self.nlp(text)
            
            # Initialize results
            results = {
                'total_count': 0,
                'filler_words': {},
                'word_positions': []
            }
            
            # Track processed spans to avoid duplicates
            processed_spans = set()
            
            # Analyze sentence by sentence to maintain context
            for sent in doc.sents:
                sent_text = sent.text
                sent_start = sent.start_char
                
                # First check for regex-based filler words
                for word, pattern in self.compiled_patterns.items():
                    matches = list(pattern.finditer(sent_text))
                    
                    # If matches found, update results
                    if matches:
                        if word not in results['filler_words']:
                            results['filler_words'][word] = {
                                'count': 0,
                                'examples': []
                            }
                        
                        # Update count and store examples
                        results['filler_words'][word]['count'] += len(matches)
                        results['total_count'] += len(matches)
                        
                        # Store positions and context
                        for match in matches:
                            start, end = match.span()
                            absolute_start = sent_start + start
                            absolute_end = sent_start + end
                            
                            # Skip if we've already processed this span
                            span_key = (absolute_start, absolute_end)
                            if span_key in processed_spans:
                                continue
                            processed_spans.add(span_key)
                            
                            # Get context (up to 30 characters before and after)
                            context_start = max(0, start - 30)
                            context_end = min(len(sent_text), end + 30)
                            context = sent_text[context_start:context_end].strip()
                            
                            # Add to word positions
                            results['word_positions'].append({
                                'word': word,
                                'start': absolute_start,
                                'end': absolute_end,
                                'text': match.group(),
                                'context': context
                            })
                            
                            # Store example if we have fewer than 3 for this word
                            if len(results['filler_words'][word]['examples']) < 3:
                                results['filler_words'][word]['examples'].append(context)
                
                # Check for 'like' filler words using spaCy's token analysis
                for token in sent:
                    if self._is_filler_like(token):
                        word = 'like'
                        if word not in results['filler_words']:
                            results['filler_words'][word] = {
                                'count': 0,
                                'examples': []
                            }
                        
                        # Get token position
                        start = token.idx
                        end = token.idx + len(token.text)
                        absolute_start = sent_start + start
                        absolute_end = sent_start + end
                        
                        # Skip if we've already processed this span
                        span_key = (absolute_start, absolute_end)
                        if span_key in processed_spans:
                            continue
                        processed_spans.add(span_key)
                        
                        results['filler_words'][word]['count'] += 1
                        results['total_count'] += 1
                        
                        # Get context
                        context_start = max(0, start - 30)
                        context_end = min(len(sent_text), end + 30)
                        context = sent_text[context_start:context_end].strip()
                        
                        # Add to word positions
                        results['word_positions'].append({
                            'word': word,
                            'start': absolute_start,
                            'end': absolute_end,
                            'text': token.text,
                            'context': context
                        })
                        
                        # Store example if we have fewer than 3
                        if len(results['filler_words'][word]['examples']) < 3:
                            results['filler_words'][word]['examples'].append(context)
            
            # Sort word positions by start position and then by word
            results['word_positions'].sort(key=lambda x: (x['start'], x['word']))
            
            return results
            
        except Exception as e:
            logger.error(f"Error analyzing text for filler words: {e}")
            raise

# Create a global instance
filler_word_analyzer = FillerWordAnalyzer() 