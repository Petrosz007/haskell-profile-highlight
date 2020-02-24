import * as fs from 'fs';
import { Position } from 'vscode';

class Profile {
	id: number;
	alloc: number;
	ticks: number;
	constructor(id: any, alloc: any, ticks: any) {
		this.id = Number(id);
		this.alloc = Number(alloc);
		this.ticks = Number(ticks);
	}
}

export class HightlightInfo {
    startPosition: Position;
    endPosition: Position;
    opacityPercentage: number;

    constructor(startPosition: Position, endPosition: Position, opacityPercentage: number) {
        this.startPosition = startPosition;
        this.endPosition = endPosition;
        this.opacityPercentage = opacityPercentage;
    }
}

function profileToListRec(profile: any): Profile[] {
	if(!profile.children) {
		return [new Profile(profile.id, profile.alloc, profile.ticks)];
	}

	return [new Profile(profile.id, profile.alloc, profile.ticks), ...profile.children.flatMap((e: any) => profileToListRec(e))];
}

function srcLocToLocation(src_loc: string): [Position, Position] | null {
	let pattern1 = /.hs:\((\d*),(\d*)\)-\((\d*),(\d*)\)/g;
	let pattern2 = /.hs:(\d*):(\d*)-(\d*)/g;

	let m: RegExpExecArray | null;
	if((m = pattern1.exec(src_loc)) && m !== null) {
		return [new Position(parseInt(m[1])-1, parseInt(m[2])-1), new Position(parseInt(m[3])-1, parseInt(m[4]))];
	} else if((m = pattern2.exec(src_loc)) && m !== null) {
		return [new Position(parseInt(m[1])-1, parseInt(m[2])-1), new Position(parseInt(m[1])-1, parseInt(m[3]))];
	}

	return null;
}

function loadProfile(source: string): any {
    const profileData = fs.readFileSync(source, 'UTF-8');
    const profileJson = JSON.parse(profileData);
    return profileJson;
}

function parseProfile(profiles: Profile[], profileJson: any): HightlightInfo[] {
    let highlights: HightlightInfo[] = [];

    profiles.forEach(p => {
        let costCenter = profileJson.cost_centres.find((e: any) => e.id == p.id);
        if(costCenter !== undefined) {
            let loc = srcLocToLocation(costCenter.src_loc);
            if(loc !== null) {
                let [start, end] = loc;
                highlights.push(new HightlightInfo(start, end, (p.alloc / profileJson.total_alloc) * 100));
            }
        }
    });

    return highlights;
}

export function getHighlightsFromFile(source: string): HightlightInfo[] {
    const profileJson = loadProfile(source);
    const profiles = profileToListRec(profileJson.profile);
    const highlights = parseProfile(profiles, profileJson);

    return highlights;
}