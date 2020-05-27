import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Note } from 'src/app/shared/note.model';
import { NotesService } from 'src/app/shared/notes.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
  animations: [
    trigger('itemAnim', [
      // ENTRY ANIMATION
      transition('void => *', [
        // Initial State
        style({
          height: 0,
          opacity: 0,
          transform: 'scale(0.85)',
          'margin-bottom':'0',

          // we have to 'expland' out the padding properties
          paddingTop: 0,
          paddingBottom: 0,
          paddingRight: 0,
          paddingLeft: 0,
        }),
        // we first want to animate the spacing
        animate('50ms', style({
          height: '*',
          'margin-bottom':'*',

          paddingTop: '*',
          paddingBottom: '*',
          paddingRight: '*',
          paddingLeft: '*',
          
        })),

        animate(150)
      ]),

      transition('* => void', [
        // first scale up
        animate(50, style({
          transform: 'scale(1.05)'
        })),
        // then scale back to normal
        animate(50, style({
          transform: 'scale(1)',
          opacity: 0.75,
        })),
        // scale down and fade out completely
        animate('120ms ease-out', style({
          transform: 'scale(0.68)',
          opacity: 0,     
        })),

        // then animate the spacing which includes height and margin and padding
        animate('150ms ease-out', style({
          height: 0,
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          'margin-bottom': '0',
        }))
      ])
    ]),

    trigger('listAnim', [
      transition('* => *', [
        query(':enter', [
          style({
            opacity: 0,
            height: 0,
          }),
          stagger(100, [
            animate('0.2s ease')
          ])
        ], { optional: true })
      ])
    ])
  ]
})



export class NotesListComponent implements OnInit {

  notes: Note[] = new Array<Note>();
  filteredNotes: Note[] = new Array<Note>();
  @ViewChild('filterInput',{static: false, read: ElementRef}) filterInputElRef: ElementRef<HTMLInputElement> ;

  constructor(private notesService: NotesService) { }

  ngOnInit(): void {
    // retrive all notes from note service
    this.notes = this.notesService.getAll();
    // this.filteredNotes = this.notesService.getAll();
    this.filter('');
  }

  deleteNote(note: Note){
    let noteId = this.notesService.getId(note);
    this.notesService.delete(noteId);
    this.filter(this.filterInputElRef.nativeElement.value);
  }

  generateNoteUrl(note: Note) {
    let noteId = this.notesService.getId(note);
    return noteId;
  }


  filter(query: string) {

    let allResults: Note[] = new Array<Note>(); 

    query = query.toLowerCase().trim();
    // split query
    let terms: string[] = query.split(' ');
    // remove duplicate search terms
    terms = this.removeDuplicates(terms);
    // compile all relavant restuls into all results array
    terms.forEach(term => {
      let results : Note[] = this.relevantNotes(term);
      // append result to all results array
      allResults = [...allResults, ...results];
    });

    // all results will inculde duplicate notes
    // this is bcoz a particular note will be result of many search terms hence we remove the duplicates
    let uniqueResults = this.removeDuplicates(allResults);
    this.filteredNotes = uniqueResults;

    // sort by relevancy
    this.sortByRelevancy(allResults);
  }

  removeDuplicates(arr: Array<any>) : Array<any> {
    let uniqueResults: Set<any> = new Set<any>();

    // loop th' the array and add items to the set
    arr.forEach(e => uniqueResults.add(e));

    return Array.from(uniqueResults);
  }

  relevantNotes(query: string) : Array<Note> {
    query = query.toLowerCase().trim();
    let relevantNotes = this.notes.filter( note => {
      if (note.title && note.title.toLowerCase().includes(query)){
        return true;
      }

      if (note.body && note.body.toLowerCase().includes(query)) {
        return true;
      }
      
      return false;
    })

    return relevantNotes;
  }

  sortByRelevancy(searchResults: Note[]) {
    // calculate relevancy of notes based on no of times it appears in seatch
    // result

    let noteCountObj: Object = {}; // key-value => nodeId-number

    searchResults.forEach(note => {
      let noteId = this.notesService.getId(note);

      if(noteCountObj[noteId]) {
        noteCountObj[noteId] += 1;
      } else {
        noteCountObj[noteId] = 1;
      }
    })

    this.filteredNotes = this.filteredNotes.sort((a: Note, b:Note) => {
      let aId = this.notesService.getId(a);
      let bId = this.notesService.getId(b);

      let aCount = noteCountObj[aId];
      let bCount = noteCountObj[bId]; 

      return bCount - aCount;
    })
  }
}
